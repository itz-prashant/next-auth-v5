import NextAuth from "next-auth"
import authConfig from "@/auth.config"
import {PrismaAdapter} from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import { getUserById } from "@/data/user"
import { UserRole } from "@prisma/client"
import { getTwoFactorConfirmationByUserId } from "./data/two-factor-confirmation"
import { getAccountByUserId } from "./data/account"


export const {
    handlers: {GET, POST},
    auth,
    signIn,
    signOut
} = NextAuth({
    pages: {
        signIn: "/auth/login",
        error: "/auth/error"
    },
    events:{
        async linkAccount({user}){
            await db.user.update({
                where:{id: user.id},
                data:{emailVerified: new Date()}
            })
        }
    },
    callbacks: {
        async signIn({user, account}){
            
            //Allow OAuth without email verification
            if(account?.provider !== "credentials") return true;

            const existingUser = await getUserById(user.id)

            // Prevent sign in without email verification 
            if(!existingUser?.emailVerified) return false;

            if(existingUser.isTwofactorEnable){
                const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id)
            
                if(!twoFactorConfirmation) return false;

                await db.twoFactorConfirmation.delete({
                    where:{id: twoFactorConfirmation.id}
                })
            }

            return true
        },
        async session ({token, session}){
            if(token.sub && session.user){
                session.user.id = token.sub
            }

            if(token.role && session.user){
                session.user.role = token.role as UserRole;
            }

            if(token.isTwoFactorEnable && session.user){
                session.user.isTwoFactorEnable = token.isTwoFactorEnable as boolean;
            }

            if(session.user){
                session.user.name = token.name;
                session.user.email = token.email as string;
                session.user.isOAuth = token.isOAuth as boolean
            }

            return session;
        },
        async jwt({token}) {
            if(!token.sub) return null;
            const existingUser = await getUserById(token.sub);

            if(!existingUser) return token;

            const existingAccount = await getAccountByUserId(
                existingUser.id
            )

            token.isOAuth = !!existingAccount
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.role = existingUser.role;
            token.isTwoFactorEnable = existingUser.isTwofactorEnable
            return token;
        }
    },
    adapter: PrismaAdapter(db),
    session: {strategy: "jwt"},
    ...authConfig,
})