import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { Wallet, TrendingUp, TrendingDown, Eye, Calendar, FileText } from "lucide-react";

const yearlyData = [
  {
    year: "२०२४",
    income: "₹ १,२५,०००",
    expense: "₹ १,१८,५००",
    balance: "₹ ६,५००",
    isActive: true,
    expenses: [
      { item: "मंडप व डेकोरेशन", amount: "₹ ४५,०००" },
      { item: "साउंड सिस्टम", amount: "₹ १५,०००" },
      { item: "बक्षीस व प्रमाणपत्रे", amount: "₹ २५,०००" },
      { item: "भोजन व्यवस्था", amount: "₹ २८,५००" },
      { item: "इतर खर्च", amount: "₹ ५,०००" },
    ],
  },
  {
    year: "२०२३",
    income: "₹ १,१०,०००",
    expense: "₹ १,०५,०००",
    balance: "₹ ५,०००",
    isActive: false,
    expenses: [
      { item: "मंडप व डेकोरेशन", amount: "₹ ४०,०००" },
      { item: "साउंड सिस्टम", amount: "₹ १२,०००" },
      { item: "बक्षीस व प्रमाणपत्रे", amount: "₹ २०,०००" },
      { item: "भोजन व्यवस्था", amount: "₹ २८,०००" },
      { item: "इतर खर्च", amount: "₹ ५,०००" },
    ],
  },
];

const Accounts = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-10 right-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              खाते माहिती
            </h1>
            <p className="text-xl text-primary-foreground/70 max-w-3xl mx-auto">
              पारदर्शक व्यवहार • प्रत्येक रुपयाचा हिशोब
            </p>
          </motion.div>
        </div>
      </section>

      {/* Transparency Banner */}
      <section className="py-8 bg-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 text-center">
            <Eye className="text-accent" size={24} />
            <p className="text-foreground">
              <span className="font-semibold">१००% पारदर्शकता:</span> संपूर्ण खाते माहिती सार्वजनिक आहे
            </p>
          </div>
        </div>
      </section>

      {/* Yearly Reports */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-accent text-sm font-medium uppercase tracking-wider">
              वार्षिक अहवाल
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              वर्षनिहाय खाते माहिती
            </h2>
            <div className="decorative-line mt-4" />
          </motion.div>

          <div className="space-y-8">
            {yearlyData.map((data, index) => (
              <motion.div
                key={data.year}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Header */}
                <div className="bg-primary p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Calendar className="text-primary-foreground" size={24} />
                    <h3 className="text-2xl font-bold text-primary-foreground">
                      वर्ष {data.year}
                    </h3>
                  </div>
                  {data.isActive && (
                    <span className="px-3 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-full">
                      चालू वर्ष
                    </span>
                  )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">एकूण जमा</p>
                      <p className="text-xl font-bold text-green-600">{data.income}</p>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <TrendingDown className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">एकूण खर्च</p>
                      <p className="text-xl font-bold text-red-600">{data.expense}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Wallet className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">शिल्लक</p>
                      <p className="text-xl font-bold text-blue-600">{data.balance}</p>
                    </div>
                  </div>
                </div>

                {/* Expense Details */}
                <div className="px-6 pb-6">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-accent" />
                    खर्चाचा तपशील
                  </h4>
                  <div className="bg-secondary rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 text-muted-foreground font-medium">बाब</th>
                          <th className="text-right p-4 text-muted-foreground font-medium">रक्कम</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expenses.map((expense, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="p-4 text-foreground">{expense.item}</td>
                            <td className="p-4 text-right text-foreground font-medium">{expense.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Statement */}
      <section className="py-16 hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Wallet className="mx-auto text-accent" size={48} />
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              विश्वासार्हता • पारदर्शकता • उत्तरदायित्व
            </h2>
            <p className="text-primary-foreground/70 leading-relaxed">
              आम्ही प्रत्येक रुपयाचा हिशोब ठेवतो आणि तो सार्वजनिक करतो. 
              कोणताही खर्च गुप्त नाही. हे आमच्या चळवळीचे वैशिष्ट्य आहे.
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Accounts;
