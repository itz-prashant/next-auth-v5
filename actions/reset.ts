"use server"
import * as z from "zod"
import { getUserByEmail } from "@/data/user"
import { ResetSchema } from "@/schema"
import { sendPasswordResetEmail } from "@/lib/mail"
import { generateResetPasswordToken } from "@/lib/tokens"


export const reset = async (values: z.infer<typeof ResetSchema>)=>{
    const validatedFields = ResetSchema.safeParse(values)

    if(!validatedFields){
        return {error : "Invalid email!"}
    }

    const {email} = validatedFields.data;

    const existingUser = await getUserByEmail(email)

    if(!existingUser){
        return {error: "Email not found"}
    }

    const passwordResetToken = await generateResetPasswordToken(email)
    await sendPasswordResetEmail(
        passwordResetToken.email,
        passwordResetToken.token
    )

    return {success: "Reset email sent!"}

}