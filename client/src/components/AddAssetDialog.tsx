import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssetAccountSchema } from "@shared/schema";
import type { InsertAssetAccount } from "@shared/schema";
import { useCreateAsset } from "@/hooks/useAssets";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const assetTypes = ["台幣", "美元", "日幣", "台股", "美股", "加密貨幣", "房地產"];
const banks = {
  台幣: ["中國信託", "國泰世華", "台新銀行", "玉山銀行", "第一銀行"],
  美元: ["Firstrade", "TD Ameritrade", "Interactive Brokers"],
  日幣: ["中國信託", "國泰世華"],
  台股: ["富邦證券", "元大證券", "凱基證券"],
  美股: ["Firstrade", "TD Ameritrade", "Charles Schwab"],
  加密貨幣: ["Binance", "MAX", "Coinbase"],
  房地產: ["自有", "其他"],
};

export default function AddAssetDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createAsset = useCreateAsset();

  const form = useForm<InsertAssetAccount>({
    resolver: zodResolver(insertAssetAccountSchema),
    defaultValues: {
      type: "",
      bankOrBroker: "",
      accountName: "",
      balance: "0",
      currency: "TWD",
      exchangeRate: "1",
    },
  });

  const selectedType = form.watch("type");

  const onSubmit = async (data: InsertAssetAccount) => {
    try {
      await createAsset.mutateAsync(data);
      toast({
        title: "成功",
        description: "資產已新增",
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "錯誤",
        description: "新增資產失敗",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-asset">
          <Plus className="w-4 h-4 mr-1" />
          新增資產
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增資產</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>資產類型</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-asset-type">
                        <SelectValue placeholder="選擇類型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankOrBroker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>銀行/券商</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedType}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-bank">
                        <SelectValue placeholder="選擇銀行/券商" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedType &&
                        banks[selectedType as keyof typeof banks]?.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>帳戶名稱（選填）</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：薪轉戶" data-testid="input-account-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>餘額</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      data-testid="input-balance"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>幣別</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TWD">台幣 (TWD)</SelectItem>
                      <SelectItem value="USD">美元 (USD)</SelectItem>
                      <SelectItem value="JPY">日幣 (JPY)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("currency") !== "TWD" && (
              <FormField
                control={form.control}
                name="exchangeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>匯率（轉換為台幣）</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        {...field}
                        data-testid="input-exchange-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button type="submit" className="flex-1" disabled={createAsset.isPending}>
                {createAsset.isPending ? "新增中..." : "新增"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
