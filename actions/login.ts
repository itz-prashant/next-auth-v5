"use server"

import * as z from "zod"
import { LoginSchema } from "@/schema"
import { signIn } from "@/auth"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"
import { AuthError } from "next-auth"
import { generateVerificationToken } from "@/lib/tokens"
import { getUserByEmail } from "@/data/user"
import { sendVeriFicationEmail } from "@/lib/mail"

export const login = async(values: z.infer<typeof LoginSchema>) => {
    const validateFields = LoginSchema.safeParse(values)

    if(!validateFields.success){
        return {error: "Inavlid fields!"}
    }

    const {email, password} = validateFields.data;

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