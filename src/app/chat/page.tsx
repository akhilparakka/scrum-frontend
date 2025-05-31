"use client";

import { Logo } from "@/components/scrummer/logo";
import { GithubOutlined } from "@ant-design/icons";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "../../components/theme-toggle";
import Main from "./main";

export default function HomePage() {
  return (
    <div className="flex h-screen w-screen justify-center overscroll-none">
      <header className="fixed top-0 left-0 flex h-12 w-full items-center justify-between px-4">
        <Logo />
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild>
            <Link href="https://github.com/bytedance/deer-flow" target="_blank">
              <GithubOutlined />
            </Link>
          </Button>
          <ModeToggle />
        </div>
      </header>
      <Main />
    </div>
  );
}
