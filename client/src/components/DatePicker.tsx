import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  
  const dateValue = value ? new Date(value) : new Date();
  const [selectedYear, setSelectedYear] = useState(dateValue.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(dateValue.getMonth());

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月"
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 當用戶選擇日期時，立即確認並關閉
  const handleDaySelect = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    onChange(date.toISOString().split('T')[0]);
    setOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // 當彈窗打開時，更新選擇的年月
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && value) {
      const d = new Date(value);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
    }
    setOpen(newOpen);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground"
        )}
        data-testid="button-date-picker"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {value ? formatDate(value) : "選擇日期"}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">年份</label>
              <div className="grid grid-cols-5 gap-1">
                {years.map((year) => (
                  <Button
                    key={year}
                    type="button"
                    variant={selectedYear === year ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedYear(year)}
                    className="h-8"
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">月份</label>
              <div className="grid grid-cols-4 gap-1">
                {months.map((month, index) => (
                  <Button
                    key={month}
                    type="button"
                    variant={selectedMonth === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMonth(index)}
                    className="h-8"
                  >
                    {month}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">日期</label>
              <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto">
                {days.map((day) => {
                  const currentDate = value ? new Date(value) : null;
                  const isSelected = currentDate && 
                    currentDate.getFullYear() === selectedYear && 
                    currentDate.getMonth() === selectedMonth && 
                    currentDate.getDate() === day;
                  
                  return (
                    <Button
                      key={day}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDaySelect(day)}
                      className="h-8"
                    >
                      {day}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
