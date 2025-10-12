import LedgerEntry from '../LedgerEntry';

export default function LedgerEntryExample() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <LedgerEntry
        type="expense"
        amount={850}
        category="餐飲"
        account="中國信託"
        date="2024/10/12"
        note="午餐"
      />
      <LedgerEntry
        type="income"
        amount={50000}
        category="薪資"
        account="國泰世華"
        date="2024/10/01"
      />
    </div>
  );
}
