import { db } from "@/lib/db";

export const getTwoFactorConfirmationByUserId = async (id: string)=>{
    try {
        const twoFactorConfirmation = await db.twoFactorConfirmation.findUnique({
            where: {userId: id}
        })

        return twoFactorConfirmation;
    } catch  {
        return null;
    }
}