import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DonationLedgerManagement from "./DonationLedgerManagement";
import LedgerExpenses from "./LedgerExpenses";
import { BookText, Receipt } from "lucide-react";

const LedgerWorkspace = () => (
  <Tabs defaultValue="donations" className="space-y-4">
    <TabsList className="grid grid-cols-2 max-w-md">
      <TabsTrigger value="donations" className="gap-2"><BookText className="h-4 w-4" /> देणगी</TabsTrigger>
      <TabsTrigger value="expenses" className="gap-2"><Receipt className="h-4 w-4" /> खर्च</TabsTrigger>
    </TabsList>
    <TabsContent value="donations" className="mt-0">
      <DonationLedgerManagement />
    </TabsContent>
    <TabsContent value="expenses" className="mt-0">
      <LedgerExpenses />
    </TabsContent>
  </Tabs>
);

export default LedgerWorkspace;
