import { cn } from "@/lib/utils"
import { ComponentProps } from "react"

export const Loading = ({ className, ...props }: ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "relative w-5 h-5 rounded-full animate-loading-rotate-45",
        "before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:box-border before:rounded-full before:border-2 before:border-b-transparent before:border-r-transparent before:animate-loading-rotate-3",
        "after:absolute after:-top-px after:-left-px after:-right-px after:-bottom-px after:box-border after:rounded-full after:border-4 after:border-b-transparent after:border-r-transparent after:animate-loading-rotate-3-out",
        // 需要适配实际网页背景
        "before:border-t-black before:border-l-black after:border-t-white after:border-l-white",
        className
      )}
      {...props}
    ></div>
  )
}

export default Loading
