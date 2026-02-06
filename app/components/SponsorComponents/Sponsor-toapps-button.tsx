'use client'
import { useRouter } from "next/navigation";

export default function SponsorToApps() {
const router = useRouter();
const toApplications = async () => {
router.push('/sponsor/driverApplications');
router.refresh;
};
return (
<button onClick={toApplications}
    style={{
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        width: '100px',
        height: '60px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
    }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
    > Applications
</button>
)
}