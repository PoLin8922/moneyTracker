import { motion } from "framer-motion";
import PiggyBankIcon from "@/components/PiggyBankIcon";
import AssetTrendChart from "@/components/AssetTrendChart";
import AssetBreakdownChart from "@/components/AssetBreakdownChart";
import AssetDetailTable from "@/components/AssetDetailTable";
import ThemeToggle from "@/components/ThemeToggle";

export default function AssetOverview() {
  //todo: remove mock functionality
  const netWorth = 580000;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">資產總覽</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center py-8"
        >
          <PiggyBankIcon netWorth={netWorth} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-4 text-center"
          >
            <p className="text-sm text-muted-foreground mb-1">總資產淨值</p>
            <h2 className="text-5xl font-bold text-primary" data-testid="text-networth">
              NT$ {netWorth.toLocaleString()}
            </h2>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <AssetTrendChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <AssetBreakdownChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <AssetDetailTable />
        </motion.div>
      </div>
    </div>
  );
}
