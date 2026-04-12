import Image from 'next/image';

const Logo = () => {
    return (
        <Image src="/img/logo.png" alt="Logo" width={184} height={60} priority />
    )
}

export default Logo;