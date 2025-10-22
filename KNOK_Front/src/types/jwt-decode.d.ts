// src/types/jwt-decode.d.ts
declare module "jwt-decode" {
  /**
   * 토큰을 디코딩해서 제네릭 T 타입으로 반환합니다.
   * 사용법: jwtDecode<DecodedToken>(token)
   */
  export default function jwtDecode<T = any>(token: string): T;
}
