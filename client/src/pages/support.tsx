import { useState } from "react";
import { 
  MessageCircle, ArrowLeft, Mail, 
  Globe, HelpCircle, Shield,
  CreditCard, BarChart3, Users, Send, MessageSquare,
  Wallet, FileCheck, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const faqCategories = [
  { id: "trading", label: "Trading", icon: BarChart3 },
  { id: "account", label: "Account", icon: Users },
  { id: "deposits", label: "Deposits & Withdrawals", icon: Wallet },
  { id: "verification", label: "Verification", icon: FileCheck },
  { id: "vip", label: "VIP Program", icon: Sparkles },
  { id: "security", label: "Security", icon: Shield },
];

const faqs = [
  {
    category: "trading",
    question: "How do I place a trade?",
    answer: "Select an asset from the market list, choose your trade amount using the slider, set your expiration time (from 30 seconds to 1 year), and click HIGHER if you think the price will go up, or LOWER if you think it will go down."
  },
  {
    category: "trading",
    question: "What is the minimum trade amount?",
    answer: "The minimum trade amount is $1. You can trade any amount from $1 up to your available balance, depending on your VIP tier."
  },
  {
    category: "trading",
    question: "What expiration times are available?",
    answer: "We offer expiration times ranging from 30 seconds to 1 year, giving you flexibility in your trading strategy. Short-term options include 30s, 1min, 5min, while long-term options extend to days, weeks, and months."
  },
  {
    category: "trading",
    question: "What is the Double Up feature?",
    answer: "Double Up allows you to duplicate your current trade with the same direction and remaining time. This is useful when you're confident in your prediction and want to increase your potential profit."
  },
  {
    category: "trading",
    question: "What is Sell Early?",
    answer: "Sell Early lets you close your trade before the expiration time. You'll receive a partial payout based on the current market conditions. This helps you secure profits or minimize losses."
  },
  {
    category: "account",
    question: "How do I verify my account?",
    answer: "Go to the Verification page in your account. You'll need to submit a valid government ID (passport, driver's license, or national ID) and proof of address (utility bill or bank statement dated within 3 months). Verification is processed within 24-48 hours."
  },
  {
    category: "account",
    question: "What are VIP tiers and how do I upgrade?",
    answer: "We offer 5 VIP tiers: Bronze, Silver, Gold, Platinum, and Diamond. Each tier provides higher payout rates, faster withdrawals, and exclusive benefits. You upgrade by increasing your trading volume and account balance."
  },
  {
    category: "account",
    question: "How do I become a VIP member?",
    answer: "VIP status is automatically assigned based on your trading activity and deposit amount. Visit the VIP page to see current requirements and benefits for each tier."
  },
  {
    category: "deposits",
    question: "What payment methods are accepted?",
    answer: "We accept Bitcoin (BTC), Ethereum (ETH), Tether (USDT), USD Coin (USDC), PayPal, and bank transfers. Crypto deposits are processed after network confirmations, while other methods may take 1-3 business days."
  },
  {
    category: "deposits",
    question: "How do I deposit funds?",
    answer: "Go to the Deposit page, select your preferred payment method, enter the amount, and follow the instructions. Crypto deposits require sending funds to your unique wallet address. All deposits require admin approval for security."
  },
  {
    category: "deposits",
    question: "How do I withdraw my funds?",
    answer: "Go to the Withdrawal page, select your payment method, enter the amount (minimum $10), and submit your request. Withdrawals are processed after admin approval, typically within 24-48 hours for verified accounts."
  },
  {
    category: "deposits",
    question: "Why do deposits and withdrawals need admin approval?",
    answer: "Admin approval is a security measure to protect your funds and prevent fraud. This ensures all transactions are legitimate and comply with anti-money laundering regulations."
  },
  {
    category: "verification",
    question: "Why do I need to verify my account?",
    answer: "Account verification is required to comply with financial regulations and protect your funds. Verified accounts have access to higher withdrawal limits and faster processing times."
  },
  {
    category: "verification",
    question: "What documents are required for verification?",
    answer: "You'll need a valid government-issued ID (passport, driver's license, or national ID) and proof of address (utility bill or bank statement dated within 3 months). Documents must be clear and readable."
  },
  {
    category: "verification",
    question: "How long does verification take?",
    answer: "Verification is typically processed within 24-48 hours. During peak times, it may take up to 72 hours. You'll receive an email notification once your account is verified."
  },
  {
    category: "vip",
    question: "What are the VIP membership tiers?",
    answer: "We offer 5 VIP tiers: Bronze, Silver, Gold, Platinum, and Diamond. Each tier provides increasing benefits including higher payout rates, faster withdrawals, personal account managers, and exclusive trading signals."
  },
  {
    category: "vip",
    question: "How do I upgrade my VIP status?",
    answer: "VIP status is automatically upgraded based on your trading volume and account balance. Visit the VIP page to see the current requirements for each tier and track your progress."
  },
  {
    category: "vip",
    question: "What benefits do VIP members receive?",
    answer: "VIP benefits include: higher payout percentages (up to 95%), priority withdrawals, dedicated account manager, exclusive market analysis, reduced fees, and access to premium trading tools."
  },
  {
    category: "security",
    question: "Is my account secure?",
    answer: "Yes, we use industry-standard security measures including encrypted connections, secure authentication through Replit, and two-factor authentication. All transactions require admin approval for added security."
  },
  {
    category: "security",
    question: "How is my personal data protected?",
    answer: "Your personal data is encrypted and stored securely. We never share your information with third parties. Verification documents are stored separately and handled according to data protection regulations."
  },
  {
    category: "security",
    question: "What should I do if I notice suspicious activity?",
    answer: "Contact our support team immediately through the contact form below or email us at support@bluewaytrading.com. We'll investigate and take necessary action to protect your account."
  },
];

export default function Support() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("trading");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const { toast } = useToast();

  const filteredFaqs = faqs.filter(faq => faq.category === selectedCategory);

  const handleSubmitContact = () => {
    if (!contactName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }
    if (!contactEmail.trim()) {
      toast({
        title: "Email Required", 
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    if (!contactMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter your message",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Message Sent",
      description: "We'll get back to you within 24 hours"
    });
    setContactName("");
    setContactEmail("");
    setContactMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="sticky top-0 z-50 glass-dark border-b border-border/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Support</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-6 pb-24 md:pb-8">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-7 h-7 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-lg">How can we help?</h2>
                <p className="text-sm text-muted-foreground">Find answers or contact our support team</p>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-3">Frequently Asked Questions</h2>
            
            <div 
              className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {faqCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  data-testid={`button-faq-${cat.id}`}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 min-h-[44px] flex-shrink-0",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "glass-light text-muted-foreground hover-elevate"
                  )}
                >
                  <cat.icon className="w-4 h-4 flex-shrink-0" />
                  {cat.label}
                </button>
              ))}
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="glass-card border-none rounded-lg overflow-hidden"
                >
                  <AccordionTrigger 
                    className="px-4 py-4 text-left hover:no-underline min-h-[56px]"
                    data-testid={`accordion-faq-${index}`}
                  >
                    <span className="text-sm font-medium pr-4">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <section>
            <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
            <Card className="glass-card p-5 md:p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  data-testid="input-contact-name"
                  className="glass-light border-border/30 min-h-[48px] text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  data-testid="input-contact-email"
                  className="glass-light border-border/30 min-h-[48px] text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <Textarea
                  placeholder="How can we help you?"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  data-testid="input-contact-message"
                  className="glass-light border-border/30 min-h-[140px] text-base resize-none"
                />
              </div>
              <Button 
                className="w-full min-h-[52px] text-base font-medium" 
                onClick={handleSubmitContact}
                data-testid="button-submit-contact"
              >
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </Button>
            </Card>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Other Ways to Reach Us</h2>
            <div className="space-y-3">
              <Card className="glass-card p-4 min-h-[72px] hover-elevate cursor-pointer active:scale-[0.98] transition-transform" data-testid="link-email-support">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-base">Email Support</div>
                    <div className="text-sm text-muted-foreground break-all">support@bluewaytrading.com</div>
                  </div>
                </div>
              </Card>
              <Card className="glass-card p-4 min-h-[72px] hover-elevate cursor-pointer active:scale-[0.98] transition-transform" data-testid="link-live-chat">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-7 h-7 text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-base">Live Chat</div>
                    <div className="text-sm text-muted-foreground">Available 24/7 for VIP members</div>
                  </div>
                </div>
              </Card>
              <Card className="glass-card p-4 min-h-[72px] hover-elevate cursor-pointer active:scale-[0.98] transition-transform" data-testid="link-help-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-7 h-7 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-base">Help Center</div>
                    <div className="text-sm text-muted-foreground break-all">help.bluewaytrading.com</div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
