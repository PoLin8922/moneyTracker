import BottomNav from '../BottomNav';
import { Route, Switch } from 'wouter';

export default function BottomNavExample() {
  return (
    <>
      <Switch>
        <Route path="/" component={() => <div className="p-4">Asset Overview Page</div>} />
        <Route path="/cash-flow" component={() => <div className="p-4">Cash Flow Page</div>} />
        <Route path="/ledger" component={() => <div className="p-4">Ledger Page</div>} />
        <Route path="/investment" component={() => <div className="p-4">Investment Page</div>} />
        <Route path="/settings" component={() => <div className="p-4">Settings Page</div>} />
      </Switch>
      <BottomNav />
    </>
  );
}
