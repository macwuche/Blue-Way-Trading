import { useState } from "react";
import { 
  MessageCircle, ArrowLeft, ChevronDown, Mail, 
  Phone, Globe, FileText, HelpCircle, Shield,
  CreditCard, BarChart3, Users
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

const faqCategories = [
  { id: "trading", label: "Trading", icon: BarChart3 },
  { id: "account", label: "Account", icon: Users },
  { id: "deposits", label: "Deposits", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
];

const faqs = [
  {
    category: "trading",
    question: "How do I place a trade?",
    answer: "Select an asset from the market list, choose your trade amount, set the expiration time, and click either HIGHER if you think the price will go up, or LOWER if you think it will go down."
  },
  {
    category: "trading",
    question: "What is the minimum trade amount?",
    answer: "The minimum trade amount is $1. You can trade any amount from $1 up to your available balance."
  },
  {
    category: "trading",
    question: "What expiration times are available?",
    answer: "We offer expiration times ranging from 5 seconds to 5 minutes, giving you flexibility in your trading strategy."
  },
  {
    category: "account",
    question: "How do I verify my account?",
    answer: "Account verification is done through your Replit account. Simply log in with your Replit credentials and your account will be automatically verified."
  },
  {
    category: "account",
    question: "Can I change my username?",
    answer: "Your username is linked to your Replit account. To change it, you would need to update your Replit profile."
  },
  {
    category: "deposits",
    question: "What payment methods are accepted?",
    answer: "This is a demo platform with virtual currency. No real deposits or withdrawals are required."
  },
  {
    category: "deposits",
    question: "How do I add funds to my account?",
    answer: "Your demo account starts with $10,000 in virtual funds. Contact support if you need your balance reset."
  },
  {
    category: "security",
    question: "Is my account secure?",
    answer: "Yes, we use industry-standard security measures including encrypted connections and secure authentication through Replit."
  },
  {
    category: "security",
    question: "What happens if I forget my password?",
    answer: "Since we use Replit authentication, you can reset your password through your Replit account settings."
  },
];

export default function Support() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("trading");
  const [contactName, setContactName] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const filteredFaqs = faqs.filter(faq => faq.category === selectedCategory);

  const handleSubmitContact = () => {
    if (contactName && contactMessage) {
      setContactName("");
      setContactMessage("");
    }
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
        <div className="p-4 space-y-6 pb-24 md:pb-4">
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">How can we help?</h2>
                <p className="text-sm text-muted-foreground">Find answers to common questions</p>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-3">FAQ</h2>
            
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
              {faqCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  data-testid={`button-faq-${cat.id}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "glass-light text-muted-foreground hover-elevate"
                  )}
                >
                  <cat.icon className="w-4 h-4" />
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
                    className="px-4 py-3 text-left hover:no-underline"
                    data-testid={`accordion-faq-${index}`}
                  >
                    <span className="text-sm font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
            <Card className="glass-card p-4 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  data-testid="input-contact-name"
                  className="glass-light border-border/30"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Message</label>
                <Textarea
                  placeholder="How can we help you?"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  data-testid="input-contact-message"
                  className="glass-light border-border/30 min-h-[120px]"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSubmitContact}
                data-testid="button-submit-contact"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Other Ways to Reach Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="glass-card p-4 hover-elevate cursor-pointer" data-testid="link-email-support">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">support@tradeflow.com</div>
                  </div>
                </div>
              </Card>
              <Card className="glass-card p-4 hover-elevate cursor-pointer" data-testid="link-help-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Help Center</div>
                    <div className="text-sm text-muted-foreground">docs.tradeflow.com</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
