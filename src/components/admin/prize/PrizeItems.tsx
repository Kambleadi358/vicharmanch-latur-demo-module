import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Package } from "lucide-react";

const PrizeItems = () => {
  const queryClient = useQueryClient();
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["prize-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prize_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addItem = useMutation({
    mutationFn: async () => {
      const qty = parseInt(quantity);
      if (!itemName.trim() || isNaN(qty) || qty <= 0) throw new Error("Invalid input");
      const { error } = await supabase.from("prize_items").insert({
        item_name: itemName.trim(),
        quantity: qty,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prize-items"] });
      setItemName("");
      setQuantity("");
      toast.success("बक्षीस वस्तू जोडली!");
    },
    onError: () => toast.error("कृपया वैध माहिती भरा"),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prize_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prize-items"] });
      toast.success("वस्तू काढली!");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          बक्षीस वस्तू व्यवस्थापन
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <Input
              placeholder="वस्तूचे नाव (उदा. Pogo Book)"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>
          <div className="w-28 space-y-1">
            <Input
              type="number"
              placeholder="संख्या"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={1}
            />
          </div>
          <Button onClick={() => addItem.mutate()} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> जोडा
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">लोड होत आहे...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>वस्तू</TableHead>
                  <TableHead className="text-center">संख्या</TableHead>
                  <TableHead className="text-right">क्रिया</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="destructive" onClick={() => deleteItem.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!items || items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      कोणत्याही वस्तू नाहीत
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrizeItems;
