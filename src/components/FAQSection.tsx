import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_visible: boolean;
}

interface FAQSectionProps {
  faqs: FAQ[];
  textColor?: string;
  className?: string;
}

export const FAQSection = ({ faqs, textColor = "#ffffff", className }: FAQSectionProps) => {
  const visibleFaqs = faqs.filter(faq => faq.is_visible);

  if (visibleFaqs.length === 0) return null;

  return (
    <section className={cn("w-full max-w-4xl mx-auto px-4 py-12", className)}>
      <h2
        className="text-3xl font-bold mb-8 text-center"
        style={{ color: textColor }}
      >
        Frequently Asked Questions
      </h2>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {visibleFaqs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            className="border border-white/10 rounded-lg px-6 bg-black/20 backdrop-blur-sm"
          >
            <AccordionTrigger
              className="hover:no-underline text-left"
              style={{ color: textColor }}
            >
              <span className="font-semibold">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent
              className="text-base leading-relaxed pt-2"
              style={{ color: textColor, opacity: 0.9 }}
            >
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
