import { useSession } from "next-auth/react";

export const UserCurrentRole = ()=>{
    const session = useSession()

    return session?.data?.user.role
}