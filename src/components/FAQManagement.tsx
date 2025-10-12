import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_visible: boolean;
}

interface FAQManagementProps {
  artistId: string;
  faqs: FAQ[];
  onUpdate: () => void;
}

const FAQ_TEMPLATES = [
  { question: "Who is [Artist Name]?", placeholder: "Short artist bio in natural tone (1-2 sentences)" },
  { question: "What kind of music or art does [Artist Name] create?", placeholder: "Describe genres, influences, vibe keywords" },
  { question: "What inspires [Artist Name]'s work?", placeholder: "Storytelling element — emotional and cultural hooks" },
  { question: "How can fans listen to or watch [Artist Name]'s performances?", placeholder: "Link to channels, platforms, or QR-commerce page" },
  { question: "Where is [Artist Name] based, and what local underground scene are they part of?", placeholder: "City, scene, collectives" },
  { question: "How can fans support [Artist Name]?", placeholder: "Direct to QR-commerce: merch, tips, event tickets" },
  { question: "Has [Artist Name] released any albums, singles, or collaborations?", placeholder: "Music releases and collaborations" },
  { question: "How did [Artist Name] get involved with the Subamerica Network?", placeholder: "Connection to Subamerica's mission" },
];

export const FAQManagement = ({ artistId, faqs, onUpdate }: FAQManagementProps) => {
  const [editingFaq, setEditingFaq] = useState<Partial<FAQ> | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAddNew = () => {
    const nextOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order)) + 1 : 0;
    setEditingFaq({
      question: "",
      answer: "",
      display_order: nextOrder,
      is_visible: true,
    });
  };

  const handleSave = async () => {
    if (!editingFaq?.question || !editingFaq?.answer) {
      toast.error("Question and answer are required");
      return;
    }

    setSaving(true);
    try {
      if (editingFaq.id) {
        const { error } = await supabase
          .from("artist_faqs")
          .update({
            question: editingFaq.question,
            answer: editingFaq.answer,
            is_visible: editingFaq.is_visible,
          })
          .eq("id", editingFaq.id);

        if (error) throw error;
        toast.success("FAQ updated");
      } else {
        const { error } = await supabase
          .from("artist_faqs")
          .insert({
            artist_id: artistId,
            question: editingFaq.question,
            answer: editingFaq.answer,
            display_order: editingFaq.display_order || 0,
            is_visible: editingFaq.is_visible ?? true,
          });

        if (error) throw error;
        toast.success("FAQ added");
      }

      setEditingFaq(null);
      onUpdate();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast.error("Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;

    try {
      const { error } = await supabase
        .from("artist_faqs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("FAQ deleted");
      onUpdate();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
    }
  };

  const handleToggleVisibility = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from("artist_faqs")
        .update({ is_visible: !faq.is_visible })
        .eq("id", faq.id);

      if (error) throw error;
      toast.success(faq.is_visible ? "FAQ hidden" : "FAQ visible");
      onUpdate();
    } catch (error) {
      console.error("Error toggling FAQ visibility:", error);
      toast.error("Failed to update FAQ");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ Section</CardTitle>
        <CardDescription>
          Optimize your artist page for search engines and voice assistants with structured FAQs.
          Answer key questions about who you are, your sound, and how fans can support you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing FAQs */}
        {faqs.length > 0 && (
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="flex items-start gap-2 p-3 border rounded-lg bg-card"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{faq.question}</p>
                  <p className="text-sm text-muted-foreground truncate">{faq.answer}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleVisibility(faq)}
                  >
                    {faq.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingFaq(faq)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(faq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Button */}
        {!editingFaq && (
          <Button onClick={handleAddNew} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        )}

        {/* Editing Form */}
        {editingFaq && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={editingFaq.question}
                onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                placeholder="Enter your FAQ question"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={editingFaq.answer}
                onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                placeholder="Enter your answer (150-300 characters recommended)"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {editingFaq.answer?.length || 0} characters
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="visible"
                checked={editingFaq.is_visible ?? true}
                onCheckedChange={(checked) => setEditingFaq({ ...editingFaq, is_visible: checked })}
              />
              <Label htmlFor="visible">Visible on public page</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save FAQ"}
              </Button>
              <Button onClick={() => setEditingFaq(null)} variant="outline">
                Cancel
              </Button>
            </div>

            {/* Template Suggestions */}
            {!editingFaq.id && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Template Questions:</p>
                <div className="space-y-1">
                  {FAQ_TEMPLATES.map((template, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setEditingFaq({
                        ...editingFaq,
                        question: template.question,
                        answer: template.placeholder,
                      })}
                    >
                      <span className="text-xs">{template.question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
