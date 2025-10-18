import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function ConnectionTest() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getApiUrl('/api/health');
      console.log('Testing URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      setHealthStatus({ success: true, data });
    } catch (err: any) {
      setHealthStatus({ success: false, error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testAuthEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getApiUrl('/api/auth/user');
      console.log('Testing URL:', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      const data = await response.json();
      setAuthStatus({ success: response.ok, data, status: response.status });
    } catch (err: any) {
      setAuthStatus({ success: false, error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const apiUrl = import.meta.env.VITE_API_URL || '(使用相對路徑)';

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>前後端連線測試</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">後端 API URL:</p>
              <p className="text-sm font-mono break-all">{apiUrl}</p>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={testHealthCheck} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                測試 Health Check
              </Button>
              <Button 
                onClick={testAuthEndpoint} 
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                測試認證端點
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive font-medium">錯誤: {error}</p>
              </div>
            )}

            {healthStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {healthStatus.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    Health Check 結果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(healthStatus, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {authStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {authStatus.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    認證端點結果 (狀態碼: {authStatus.status})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(authStatus, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">使用說明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. 點擊「測試 Health Check」確認後端基本連線</p>
            <p>2. 點擊「測試認證端點」確認認證系統是否正常</p>
            <p>3. 打開瀏覽器開發工具 (F12) 查看 Console 和 Network 標籤獲取更多資訊</p>
            <p className="mt-4 text-muted-foreground">
              如果測試失敗，請檢查：
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Vercel 環境變數 VITE_API_URL 是否設置正確</li>
              <li>Render 後端服務是否正在運行</li>
              <li>CORS 設定是否允許 Vercel 域名</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
