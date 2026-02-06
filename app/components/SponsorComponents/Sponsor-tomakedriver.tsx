'use client'
import { useRouter } from "next/navigation";    
export default function ToMakeDrivers() {
    const router = useRouter();
    const toDriverPage = async () => {
    router.push('/sponsor/create-driver');
    router.refresh;
    };
    {/*Make Driver button */}
    return(
        <button onClick= {toDriverPage}
        style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            width: '100px',
            height: '60px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginLeft: '250px'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
        > Make Driver
        </button>
    )
}