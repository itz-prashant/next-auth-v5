"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { ResetSchema } from "@/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "../form-error";
import { FormSucces } from "../form-success";
import { reset } from "@/actions/reset";
import { useState, useTransition } from "react";

export const ResetForm = () => {

  const [isPending, startTransition] = useTransition()

  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onClick = (values: z.infer<typeof ResetSchema>) => {
    setError("");
    setSuccess("");

    console.log(values)

    startTransition(async ()=>{
      const data = await reset(values)
      setError(data?.error);
      setSuccess(data?.success)
    })
  }

  return (
    <CardWrapper
      headerLabel="forgot ypur password?"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
      >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onClick)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                        {...field}
                        disabled={isPending}
                        placeholder="john.doe@example.com"
                        type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error }/>
          <FormSucces message={success}/>
          <Button
          disabled={isPending}
          type="submit"
          className="w-full cursor-pointer"
          >
            Send reset email
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
