"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  AuthState,
  LoginCredentials,
  UserRole,
  Permission,
  hasPermission,
} from "@/types/auth";
import {
  onAuthStateChanged,
  getMultiFactorResolver,
  MultiFactorError,
  MultiFactorResolver,
  signInWithEmailAndPassword,
  signOut,
  TotpMultiFactorGenerator,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { adminUserService } from "@/services/adminUserService";
import { FirestoreAdminUser } from "@/lib/firestore-schema";
import { useRef } from "react";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  completeMfaSignIn: (code: string) => Promise<void>;
  cancelMfaSignIn: () => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "MFA_REQUIRED"; payload: AuthState["mfaChallenge"] }
  | { type: "MFA_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "CLEAR_ERROR" };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        mfaChallenge: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        mfaChallenge: null,
      };
    case "MFA_REQUIRED":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        mfaChallenge: action.payload,
      };
    case "MFA_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        mfaChallenge: null,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  mfaChallenge: null,
};

/**
 * Convert a Firestore admin user document to our app's User type
 */
function mapAdminUserToUser(adminUser: FirestoreAdminUser): User {
  const mappedPermissions: Permission[] = (adminUser.permissions || []).map(
    (permission) => ({
      resource: permission.resource,
      actions: [...permission.actions],
    })
  );

  return {
    id: adminUser.uid,
    email: adminUser.email,
    name: adminUser.name,
    role:
      adminUser.accessLevel === "system_admin"
        ? UserRole.SYSTEM_ADMIN
        : UserRole.ADMIN,
    accessLevel: adminUser.accessLevel,
    avatar: "/img/testimonials-1.webp",
    createdAt: adminUser.createdAt?.toDate?.() ?? new Date(),
    lastLogin: adminUser.lastLogin?.toDate?.() ?? new Date(),
    lastActivity: adminUser.lastActivity?.toDate?.(),
    isActive: adminUser.isActive,
    mfaEnabled: adminUser.twoFactorEnabled,
    mfaRequired: adminUser.mfaRequired,
    mustChangePassword: adminUser.mustChangePassword,
    passwordRotationDueAt: adminUser.passwordRotationDueAt?.toDate?.(),
    permissions: mappedPermissions,
  };
}

function mapSessionUserToUser(sessionUser: {
  id: string;
  email: string;
  name: string;
  role: string;
  accessLevel?: string;
  lastLogin?: string | null;
  lastActivity?: string | null;
  isActive: boolean;
  mfaEnabled?: boolean;
  mfaRequired?: boolean;
  mustChangePassword?: boolean;
  passwordRotationDueAt?: string | null;
  sessionId?: string | null;
  permissions?: Permission[];
}): User {
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    role:
      sessionUser.role === UserRole.SYSTEM_ADMIN
        ? UserRole.SYSTEM_ADMIN
        : UserRole.ADMIN,
    accessLevel: sessionUser.accessLevel as User["accessLevel"],
    avatar: "/img/testimonials-1.webp",
    createdAt: new Date(),
    lastLogin: sessionUser.lastLogin ? new Date(sessionUser.lastLogin) : undefined,
    lastActivity: sessionUser.lastActivity ? new Date(sessionUser.lastActivity) : undefined,
    isActive: sessionUser.isActive,
    sessionId: sessionUser.sessionId ?? undefined,
    mfaEnabled: sessionUser.mfaEnabled,
    mfaRequired: sessionUser.mfaRequired,
    mustChangePassword: sessionUser.mustChangePassword,
    passwordRotationDueAt: sessionUser.passwordRotationDueAt
      ? new Date(sessionUser.passwordRotationDueAt)
      : undefined,
    permissions: sessionUser.permissions ?? [],
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const mfaResolverRef = useRef<MultiFactorResolver | null>(null);

  const establishAdminSession = useCallback(
    async (firebaseUser: FirebaseUser) => {
      const adminUser = await adminUserService.getAdminUserByUid(firebaseUser.uid);

      if (!adminUser) {
        await signOut(auth);
        throw new Error("You do not have admin access");
      }

      if (!adminUser.isActive || adminUser.isLocked) {
        await signOut(auth);
        throw new Error("Account is inactive or locked");
      }

      const idToken = await firebaseUser.getIdToken();
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        await signOut(auth);
        throw new Error("Unable to establish a secure admin session");
      }

      const sessionData = await sessionResponse.json();
      const user = sessionData?.user
        ? mapSessionUserToUser(sessionData.user)
        : mapAdminUserToUser(adminUser);

      adminUserService.updateLastLogin(firebaseUser.uid).catch(console.error);
      mfaResolverRef.current = null;
      dispatch({ type: "LOGIN_SUCCESS", payload: user });
    },
    []
  );

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );
      await establishAdminSession(userCredential.user);
    } catch (error: any) {
      let message = "Authentication failed";
      if (error?.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error as MultiFactorError);
        const totpHint = resolver.hints.find((hint) => hint.factorId === "totp");

        if (!totpHint) {
          dispatch({
            type: "LOGIN_FAILURE",
            payload: "This admin account requires an unsupported second factor.",
          });
          return;
        }

        mfaResolverRef.current = resolver;
        dispatch({
          type: "MFA_REQUIRED",
          payload: {
            factorId: totpHint.factorId,
            enrollmentId: totpHint.uid,
            displayName: totpHint.displayName ?? null,
            email: credentials.email,
          },
        });
        return;
      }

      if (
        error?.code === "auth/user-not-found" ||
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/invalid-credential"
      ) {
        message = "Invalid email or password";
      } else if (error?.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later.";
      } else if (error instanceof Error) {
        message = error.message;
      }
      dispatch({ type: "LOGIN_FAILURE", payload: message });
    }
  }, [establishAdminSession]);

  const completeMfaSignIn = useCallback(
    async (code: string) => {
      if (!mfaResolverRef.current || !state.mfaChallenge) {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: "No multi-factor sign-in challenge is pending.",
        });
        return;
      }

      dispatch({ type: "LOGIN_START" });

      try {
        const assertion = TotpMultiFactorGenerator.assertionForSignIn(
          state.mfaChallenge.enrollmentId,
          code.trim()
        );
        const userCredential = await mfaResolverRef.current.resolveSignIn(assertion);
        await establishAdminSession(userCredential.user);
      } catch (error: any) {
        let message = "Unable to verify the authentication code.";
        if (
          error?.code === "auth/invalid-verification-code" ||
          error?.code === "auth/code-expired"
        ) {
          message = "Invalid or expired authentication code.";
        } else if (error instanceof Error) {
          message = error.message;
        }
        dispatch({ type: "MFA_FAILURE", payload: message });
      }
    },
    [establishAdminSession, state.mfaChallenge]
  );

  const cancelMfaSignIn = useCallback(() => {
    mfaResolverRef.current = null;
    dispatch({ type: "LOGOUT" });
  }, []);

  const logout = useCallback(async () => {
    mfaResolverRef.current = null;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase sign out error:", error);
    }
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    }).catch((error) => {
      console.error("Session cleanup error:", error);
    });
    dispatch({ type: "LOGOUT" });
  }, []);

  const checkAuth = useCallback(async () => {
    // checkAuth is handled by onAuthStateChanged listener below
    // This is kept for interface compatibility
  }, []);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    // This handles session persistence (page refresh, new tab, etc.)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // User is signed in — fetch their admin data using direct document read
          const adminUser = await adminUserService.getAdminUserByUid(
            firebaseUser.uid,
          );

          if (adminUser && adminUser.isActive && !adminUser.isLocked) {
            await establishAdminSession(firebaseUser);
          } else {
            await signOut(auth);
            dispatch({ type: "LOGOUT" });
          }
        } catch (error) {
          console.error("Auth state check failed:", error);
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "LOGOUT" });
      }
    });

    return () => unsubscribe();
  }, [establishAdminSession]);

  const value: AuthContextType = {
    ...state,
    login,
    completeMfaSignIn,
    cancelMfaSignIn,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const usePermissions = () => {
  const { user } = useAuth();

  const checkPermission = (resource: string, action: string): boolean => {
    if (!user) return false;

    return hasPermission(user.role, resource, action, user.permissions);
  };

  return { hasPermission: checkPermission };
};
