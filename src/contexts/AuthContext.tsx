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
  hasPermission,
} from "@/types/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { adminUserService } from "@/services/adminUserService";
import { FirestoreAdminUser } from "@/lib/firestore-schema";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGIN_FAILURE"; payload: string }
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
      };
    case "LOGIN_FAILURE":
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
};

/**
 * Convert a Firestore admin user document to our app's User type
 */
function mapAdminUserToUser(adminUser: FirestoreAdminUser): User {
  return {
    id: adminUser.uid,
    email: adminUser.email,
    name: adminUser.name,
    role:
      adminUser.accessLevel === "super_admin" ? UserRole.ADMIN : UserRole.USER,
    avatar: "/img/testimonials-1.webp",
    createdAt: adminUser.createdAt?.toDate?.() ?? new Date(),
    lastLogin: new Date(),
    isActive: adminUser.isActive,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: "LOGIN_START" });
    try {
      // Step 1: Authenticate with Firebase Auth FIRST
      // This establishes an authenticated session before any Firestore queries
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      const firebaseUser = userCredential.user;

      // Step 2: Now that we're authenticated, fetch admin user data from Firestore
      // Use direct document read by UID (not a collection query) to work with security rules
      const adminUser = await adminUserService.getAdminUserByUid(
        firebaseUser.uid,
      );

      if (!adminUser) {
        // User exists in Firebase Auth but not in admin_users collection
        await signOut(auth);
        throw new Error("You do not have admin access");
      }

      if (!adminUser.isActive || adminUser.isLocked) {
        await signOut(auth);
        throw new Error("Account is inactive or locked");
      }

      const user = mapAdminUserToUser(adminUser);

      // Set token for middleware cookie check
      const token = await firebaseUser.getIdToken();
      localStorage.setItem("auth_token", token);
      document.cookie = `auth-token=${token}; path=/; max-age=86400; secure; samesite=strict`;

      // Update last login in Firestore (non-blocking)
      adminUserService.updateLastLogin(firebaseUser.uid).catch(console.error);

      dispatch({ type: "LOGIN_SUCCESS", payload: user });
    } catch (error: any) {
      // Map Firebase Auth error codes to user-friendly messages
      let message = "Authentication failed";
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
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase sign out error:", error);
    }
    localStorage.removeItem("auth_token");
    document.cookie =
      "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
            const user = mapAdminUserToUser(adminUser);

            // Refresh token for middleware
            const token = await firebaseUser.getIdToken();
            localStorage.setItem("auth_token", token);
            document.cookie = `auth-token=${token}; path=/; max-age=86400; secure; samesite=strict`;

            dispatch({ type: "LOGIN_SUCCESS", payload: user });
          } else {
            // Admin user not found or inactive — sign out
            await signOut(auth);
            localStorage.removeItem("auth_token");
            document.cookie =
              "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            dispatch({ type: "LOGOUT" });
          }
        } catch (error) {
          console.error("Auth state check failed:", error);
          dispatch({ type: "LOGOUT" });
        }
      } else {
        // No user signed in
        localStorage.removeItem("auth_token");
        document.cookie =
          "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        dispatch({ type: "LOGOUT" });
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
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

    return hasPermission(user.role, resource, action);
  };

  return { hasPermission: checkPermission };
};
