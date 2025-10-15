import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Asset {
  bank: string;
  balance: number;
  currency: string;
  exchangeRate?: number;
}

interface AssetType {
  type: string;
  assets: Asset[];
}

interface AssetDetailTableProps {
  data?: AssetType[];
}

export default function AssetDetailTable({ data }: AssetDetailTableProps) {
  const assetData = data || [];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">資產明細</h3>
        <Button size="sm" onClick={() => window.location.href = "/account-management"} data-testid="button-account-management">
          <Plus className="w-4 h-4 mr-1" />
          帳戶管理
        </Button>
      </div>
      {assetData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">尚未新增任何帳戶</p>
          <p className="text-sm text-muted-foreground mt-2">點擊上方按鈕開始新增帳戶</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {assetData.map((assetType, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3" data-testid={`accordion-${assetType.type}`}>
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-medium">{assetType.type}</span>
                  <span className="text-sm text-muted-foreground">
                    {assetType.assets.length} 個帳戶
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="space-y-2 mt-2">
                  {assetType.assets.map((asset, assetIdx) => {
                    const twd = asset.exchangeRate
                      ? asset.balance * asset.exchangeRate
                      : asset.balance;
                    return (
                      <div
                        key={assetIdx}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                        data-testid={`asset-${asset.bank}`}
                      >
                        <div>
                          <p className="font-medium text-sm">{asset.bank}</p>
                          <p className="text-xs text-muted-foreground">
                            {asset.currency} {asset.balance.toLocaleString()}
                            {asset.exchangeRate && asset.exchangeRate !== 1 && ` × ${asset.exchangeRate}`}
                          </p>
                        </div>
                        <p className="font-semibold">NT$ {twd.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Card>
  );
}
