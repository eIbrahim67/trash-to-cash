import { useEffect, useState } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar, ArrowLeft, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    createdAt: string;
    userId: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const d = docSnap.data();
                    const createdAt = d.createdAt as Timestamp;
                    setProfile({
                        firstName: d.firstName || "",
                        lastName: d.lastName || "",
                        email: d.email || currentUser.email || "",
                        phone: d.phone || "",
                        role: d.role || "employ",
                        createdAt: createdAt?.toDate?.().toLocaleDateString() ?? "N/A",
                        userId: d.userId || currentUser.uid,
                    });
                } else {
                    // Fallback: use Firebase Auth data
                    setProfile({
                        firstName: currentUser.displayName?.split(" ")[0] || "Admin",
                        lastName: currentUser.displayName?.split(" ")[1] || "",
                        email: currentUser.email || "",
                        phone: "",
                        role: "admin",
                        createdAt: "N/A",
                        userId: currentUser.uid,
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success("Signed out successfully");
        } catch {
            toast.error("Failed to sign out");
        }
    };

    if (loading) return <div className="p-8 text-muted-foreground">Loading profile...</div>;

    const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Unknown";
    const initials = [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
    const roleLabel = profile?.role === "admin" ? "Administrator" : profile?.role === "employ" ? "Employee" : profile?.role ?? "User";

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-2">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} /> Back
            </button>

            {/* Profile card */}
            <div className="rounded-2xl border bg-card p-8 shadow-sm">
                {/* Avatar + Name */}
                <div className="flex flex-col items-center gap-4 pb-8 border-b">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-md">
                        {initials}
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-card-foreground">{fullName}</h1>
                        <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
                            {roleLabel}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="mt-6 space-y-4">
                    <ProfileField icon={Mail} label="Email" value={profile?.email || "—"} />
                    <ProfileField icon={Phone} label="Phone" value={profile?.phone || "—"} />
                    <ProfileField icon={Calendar} label="Member Since" value={profile?.createdAt || "—"} />
                    <ProfileField icon={User} label="User ID" value={profile?.userId || "—"} mono />
                </div>
            </div>

            {/* Sign out */}
            <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
                <LogOut size={16} /> Sign Out
            </button>
        </div>
    );
}

function ProfileField({
    icon: Icon,
    label,
    value,
    mono = false,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-center gap-4 rounded-xl border bg-muted/30 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className={`truncate text-sm font-semibold text-card-foreground ${mono ? "font-mono text-xs" : ""}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}
