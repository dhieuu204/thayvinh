import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../lib/api";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

export default function OAuthCallbackPage() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const ran       = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const error = params.get("error");
    if (error) {
      toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.");
      navigate("/login", { replace: true });
      return;
    }

    // Token không được truyền qua URL nữa — dùng refresh token cookie để lấy access token
    axios
      .post(`${API_URL}/api/auth/refresh-token`, {}, { withCredentials: true })
      .then(({ data }) => {
        const newToken = data.token;
        localStorage.setItem("token", newToken);
        return axios.get(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${newToken}` },
          withCredentials: true,
        });
      })
      .then((res) => {
        const user = res.data.data || res.data.user || res.data;
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new Event("userUpdated"));
        toast.success("Đăng nhập Google thành công!");
        navigate("/", { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("token");
        toast.error("Không thể lấy thông tin tài khoản. Vui lòng thử lại.");
        navigate("/login", { replace: true });
      });
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#fafafa]"
      style={{ fontFamily: SF_FONT }}
    >
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[15px] text-[#1d1d1f]">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
