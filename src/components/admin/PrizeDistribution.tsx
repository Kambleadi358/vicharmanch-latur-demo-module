import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Gift, FileText } from "lucide-react";
import PrizeItems from "./prize/PrizeItems";
import PrizeAllocation from "./prize/PrizeAllocation";
import PrizeReport from "./prize/PrizeReport";

const PrizeDistribution = () => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1">
          <TabsTrigger value="items" className="gap-1 text-xs sm:text-sm py-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">बक्षीस वस्तू</span>
          </TabsTrigger>
          <TabsTrigger value="allocate" className="gap-1 text-xs sm:text-sm py-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">वाटप</span>
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1 text-xs sm:text-sm py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">अहवाल</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <PrizeItems />
        </TabsContent>
        <TabsContent value="allocate">
          <PrizeAllocation />
        </TabsContent>
        <TabsContent value="report">
          <PrizeReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrizeDistribution;
