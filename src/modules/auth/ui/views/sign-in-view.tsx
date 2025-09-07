"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { FaGithub, FaGoogle } from "react-icons/fa";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { OctagonAlertIcon, OctagonIcon } from "lucide-react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function SignInView() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Move useSession to top-level
  const { data: sessionData } = authClient.useSession();

  const handleRedirect = () => {
    if (sessionData?.user.email == process.env.ADMIN_EMAIL) {
      router.push("/admin");
    } else if (sessionData?.user.email == process.env.WORKER_EMAIL) {
      router.push("/worker");
    } else {
      router.push("/");
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);
    authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
          handleRedirect();
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error.message);
          // Redirect to sign-up if user not found or similar error
          if (
            error.message?.toLowerCase().includes("not found") ||
            error.message?.toLowerCase().includes("no user") ||
            error.message?.toLowerCase().includes("does not exist")
          ) {
            router.push("/auth/sign-up");
          }
        },
      }
    );
  };

  const onSocial = (provider: "google" | "github") => {
    setError(null);
    setPending(true);
    authClient.signIn.social(
      {
        provider: provider,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
          handleRedirect();
        },
        onError: ({ error }) => {
          setError(error.message);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 min-h-screen">
      <Card className="overflow-hidden p-0 bg-blue-50 border border-blue-200">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
              <div className="flex flex-col g-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold text-blue-900">
                    Welcome Back!
                  </h1>
                  <p className="text-blue-700 text-balance">
                    Login to your account
                  </p>
                </div>
                <div className="grid gap-3 m-1.5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel className="text-blue-800">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="me@gmail.com"
                              className="bg-blue-100 border-blue-300 text-blue-900 focus:border-blue-400"
                              {...field}
                            ></Input>
                          </FormControl>
                          <FormMessage className="text-blue-500"></FormMessage>
                        </FormItem>
                      );
                    }}
                  ></FormField>
                </div>
                <div className="grid gap-3 m-1.5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel className="text-blue-800">
                            Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="********"
                              className="bg-blue-100 border-blue-300 text-blue-900 focus:border-blue-400"
                              {...field}
                            ></Input>
                          </FormControl>
                          <FormMessage className="text-blue-500"></FormMessage>
                        </FormItem>
                      );
                    }}
                  ></FormField>
                </div>
                {!!error && (
                  <Alert className="bg-blue-200 border-blue-400 text-blue-900 m-1.5">
                    <OctagonAlertIcon className="h-4 w-4 text-blue-700" />
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                )}
                <Button
                  disabled={pending}
                  className="w-full m-1.5 bg-blue-600 text-white hover:bg-blue-700 border-blue-400"
                  type="submit"
                >
                  Sign In
                </Button>
                <div className="m-1.5 after:border-blue-300 relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-blue-100 text-blue-700 relative z-10 px-2">
                    Or Continue with
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-0.5">
                  <Button
                    disabled={pending}
                    onClick={() => onSocial("google")}
                    variant="outline"
                    type="button"
                    className="w-full bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-200"
                  >
                    <FaGoogle />
                  </Button>
                  <Button
                    disabled={pending}
                    onClick={() => onSocial("github")}
                    variant="outline"
                    type="button"
                    className="w-full bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-200"
                  >
                    <FaGithub />
                  </Button>
                </div>
                <div className="text-center text-sm text-blue-800">
                  Don&apos;t have an account?
                  <Link
                    className="underline underline-offset-4 text-blue-700 hover:text-blue-500"
                    href="/auth/sign-up"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </form>
          </Form>
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 relative hidden md:flex flex-col gap-y-4 items-center justify-center h-full w-full p-4">
            <img
              src="/logo.png"
              alt="logo"
              className="h-[92px] w-[92px] rounded-2xl border-4 border-blue-400"
            ></img>
            <p className="text-2xl font-semibold text-white">Richy Rich</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By Clicking continue, you are going to our{" "}
        <a href="#">Terms of service</a> and <a href="#">Privay Policy</a>
      </div>
    </div>
  );
}
