"use server"

import * as z from "zod"
import { LoginSchema } from "@/schema"
import { signIn } from "@/auth"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"
import { AuthError } from "next-auth"
import { generateVerificationToken, generateTwofactorToken } from "@/lib/tokens"
import { getUserByEmail } from "@/data/user"
import { sendVeriFicationEmail , sendTwoFactorTokenEmail} from "@/lib/mail"
import { getTowFactorTokenByEmail } from "@/data/two-factor-token"
import { db } from "@/lib/db"
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation"


export const login = async(values: z.infer<typeof LoginSchema>) => {
    const validateFields = LoginSchema.safeParse(values)

    if(!validateFields.success){
        return {error: "Inavlid fields!"}
    }

    const {email, password, code} = validateFields.data;

    const existingUser = await getUserByEmail(email)

    if(!existingUser || !existingUser.email || !existingUser.password){
        return {error : "Email does not exist"}
    }

    if(!existingUser.emailVerified){
        const verifiCationToken = await generateVerificationToken(existingUser.email)
        
        await sendVeriFicationEmail(
            verifiCationToken.email,
            verifiCationToken.token
        )

        return {success: "Confirmation email sent!"}
    }

    if(existingUser.isTwofactorEnable && existingUser.email){
        if(code){

            const twofactorToken = await getTowFactorTokenByEmail(
                existingUser.email
            )
      
            if(!twofactorToken){
                return {error: "Invalid token!"}
            }
            if(twofactorToken.token !== code){
                return {error: "Invalid token!"}
            }

            const hasExpired = new Date(twofactorToken.expires) < new Date()
            if(hasExpired){
                return {error: "Token has expired"}
            }
            await db.twoFactorToken.delete({
                where:{id: twofactorToken.id}
            })

            const existingConfirmation = await getTwoFactorConfirmationByUserId(
                existingUser.id
            )

            if(existingConfirmation){
       
                await db.twoFactorConfirmation.delete({
                    where:{id: existingConfirmation.id}
                })
            }

            await db.twoFactorConfirmation.create({
                data:{
                    userId: existingUser.id
                }
            })

        }else{
        const towFactorToken = await generateTwofactorToken(existingUser.email)
        await sendTwoFactorTokenEmail(
            towFactorToken.email,
            towFactorToken.token
        );

        return {twoFactor: true}
    }
    }
    
    try {
      await signIn("credentials", {
            email,
            password,
            redirectTo: DEFAULT_LOGIN_REDIRECT
        })
        
    } catch (error) {
        if(error instanceof AuthError){
            switch (error?.type){
                case "CredentialsSignin":
                    return {error : "Invalid credentials"}
                default:
                    return {error: "Something went wrong"}    
            }
        }
        throw error;
    }
}