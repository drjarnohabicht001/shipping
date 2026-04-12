import Image from 'next/image';

export const FooterLogo = () => {
    return (
        <Image src="/img/logo.png" alt="Footer Logo" width={290} height={94} priority />
    )
}