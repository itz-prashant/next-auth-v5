"use server"

import * as z from "zod"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { SettingSchema } from "@/schema"
import { getUserByEmail, getUserById } from "@/data/user"
import { currentUser } from "@/lib/auth"
import { generateVerificationToken } from "@/lib/tokens"
import { sendVeriFicationEmail } from "@/lib/mail"

export const settings = async (
    values: z.infer<typeof SettingSchema>
)=>{
    const user = await currentUser()
    if(!user){
        return {error: "Unauthorized"}
    }

    const dbUser = await getUserById(user.id)
    if(!dbUser){
        return {error: "Unauthorized"}
    }

    if(user.isOAuth){
        values.email = undefined;
        values.password = undefined;
        values.newPassword = undefined
        values.isTwoFactorEnable = undefined
    }

    if(values.email && values.email !== user.email){
        const existingUser = await getUserByEmail(values.email)

        if(existingUser && existingUser.id !== user.id){
            return {error: "Email already in use!"}
        }

        const veriFicationToken = generateVerificationToken(
            values.email
        )

        await sendVeriFicationEmail(
            veriFicationToken.email,
            veriFicationToken.token
        )

        return {success: "Verification email sent"}
    }

    if(values.password && values.newPassword && dbUser.password){
        const passwordMatch = await bcrypt.compare(
            values.password,
            dbUser.password
        )
        if(!passwordMatch){
            return {error: "Incorrect password"}
        }
        const hashedPashword = await bcrypt.hash(
            values.newPassword,
            10
        )
        values.password = hashedPashword
        values.newPassword = undefined
    }

    await db.user.update({
        where:{id: dbUser.id},
        data:{
            ...values
        }
    })

    return {success: "Settings updated"}
}