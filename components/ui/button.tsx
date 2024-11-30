import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// buttonVariants는 버튼의 모든 스타일 변형을 정의합니다.
// cva를 사용하여 조건부 클래스 적용을 관리합니다.
const buttonVariants = cva(
  // 모든 버튼에 적용되는 기본 스타일
  // - inline-flex: 인라인 요소로 flex 적용
  // - items-center, justify-center: 내용 중앙 정렬
  // - rounded-md: 모서리 둥글게
  // - text-sm: 작은 텍스트 크기
  // - font-medium: 중간 굵기 폰트
  // - transition-colors: 색상 변경 시 애니메이션
  // - focus-visible: 키보드 포커스 시 스타일
  // - disabled: 비활성화 상태 스타일
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      // variant: 버튼의 시각적 스타일을 정의
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90", // 기본 스타일
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90", // 삭제/위험 액션용
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground", // 테두리만 있는 스타일
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80", // 보조 스타일
        ghost: "hover:bg-accent hover:text-accent-foreground", // 배경 없는 스타일
        link: "underline-offset-4 hover:underline text-primary", // 링크처럼 보이는 스타일
      },
      // size: 버튼의 크기를 정의
      size: {
        default: "h-10 py-2 px-4", // 기본 크기
        sm: "h-9 px-3 rounded-md", // 작은 크기
        lg: "h-11 px-8 rounded-md", // 큰 크기
      },
    },
    // 기본값 설정
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// 버튼 컴포넌트의 Props 타입 정의
// HTML 버튼 속성을 확장하고 variant와 size 옵션 추가
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean; // true일 경우 자식 요소를 버튼으로 변환
}

// 버튼 컴포넌트 구현
// React.forwardRef를 사용하여 ref 전달 가능하게 함
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // asChild가 true면 Slot 컴포넌트 사용, 아니면 일반 button 사용
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        // cn 유틸리티로 클래스네임들을 병합
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
// 개발자 도구에서 컴포넌트 이름 표시
Button.displayName = "Button";

export { Button, buttonVariants };

/* 사용 예시:
  기본 버튼:
  <Button>Click me</Button>

  아웃라인 스타일의 작은 버튼:
  <Button variant="outline" size="sm">Small button</Button>

  링크 스타일 버튼:
  <Button variant="link">Link button</Button>

  비활성화된 버튼:
  <Button disabled>Disabled</Button>
*/
