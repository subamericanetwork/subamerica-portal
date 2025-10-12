import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, GripVertical, CheckCircle2, Circle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  { 
    id: "who",
    question: "Who is [Artist Name]?", 
    placeholder: "Short artist bio in natural tone (1-2 sentences). Example: 'Colleen Anthony is a New York-based punk musician and digital media innovator behind the Subamerica Network, blending analog rebellion with futuristic sound.'" 
  },
  { 
    id: "what-music",
    question: "What kind of music or art does [Artist Name] create?", 
    placeholder: "Describe genres, influences, vibe keywords. Example: 'Her work fuses underground punk energy with electronic textures and spoken-word storytelling.'" 
  },
  { 
    id: "inspiration",
    question: "What inspires [Artist Name]'s work?", 
    placeholder: "Storytelling element — emotional and cultural hooks. Example: 'Themes of freedom, technology, and resistance — celebrating independent voices outside mainstream algorithms.'" 
  },
  { 
    id: "listen-watch",
    question: "How can fans listen to or watch [Artist Name]'s performances?", 
    placeholder: "Link to channels, platforms, or QR-commerce page. Example: 'Tune in on Subamerica TV via Roku, Fire TV, or Google TV, or stream clips on subamerica.net/[your-slug].'" 
  },
  { 
    id: "location-scene",
    question: "Where is [Artist Name] based, and what local underground scene are they part of?", 
    placeholder: "City, scene, collectives. Example: 'She performs and produces from New York City's indie underground scene, collaborating with global DIY creators.'" 
  },
  { 
    id: "support",
    question: "How can fans support [Artist Name]?", 
    placeholder: "Direct to QR-commerce: merch, tips, event tickets. Example: 'Buy merch, tip during live sets, or join her SubClub fan community through QR-commerce links on her artist page.'" 
  },
  { 
    id: "releases",
    question: "Has [Artist Name] released any albums, singles, or collaborations?", 
    placeholder: "Music releases and collaborations. Example: 'Yes — she's featured in Subamerica's Harsh St. Reality revival project and upcoming Voices of Resistance sessions.'" 
  },
  { 
    id: "subamerica",
    question: "How did [Artist Name] get involved with the Subamerica Network?", 
    placeholder: "Connection to Subamerica's mission. Example: 'As founder and visionary of Subamerica, Colleen built the network to empower underground creators worldwide.'" 
  },
];

export const FAQManagement = ({ artistId, faqs, onUpdate }: FAQManagementProps) => {
  const [editingFaq, setEditingFaq] = useState<Partial<FAQ> | null>(null);
  const [saving, setSaving] = useState(false);
  const [templateAnswers, setTemplateAnswers] = useState<Record<string, string>>({});

  const getTemplateAnswer = (templateId: string) => {
    const existingFaq = faqs.find(faq => 
      FAQ_TEMPLATES.find(t => t.id === templateId && t.question === faq.question)
    );
    return existingFaq?.answer || templateAnswers[templateId] || "";
  };

  const isTemplateAnswered = (templateId: string) => {
    return faqs.some(faq => 
      FAQ_TEMPLATES.find(t => t.id === templateId && t.question === faq.question)
    );
  };

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

  const handleSaveTemplate = async (template: typeof FAQ_TEMPLATES[0]) => {
    const answer = templateAnswers[template.id];
    if (!answer || answer.trim().length === 0) {
      toast.error("Please provide an answer");
      return;
    }

    setSaving(true);
    try {
      const existingFaq = faqs.find(faq => faq.question === template.question);
      
      if (existingFaq) {
        const { error } = await supabase
          .from("artist_faqs")
          .update({ answer })
          .eq("id", existingFaq.id);

        if (error) throw error;
        toast.success("FAQ updated");
      } else {
        const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order)) : -1;
        const { error } = await supabase
          .from("artist_faqs")
          .insert({
            artist_id: artistId,
            question: template.question,
            answer,
            display_order: maxOrder + 1,
            is_visible: true,
          });

        if (error) throw error;
        toast.success("FAQ added");
      }

      setTemplateAnswers(prev => ({ ...prev, [template.id]: "" }));
      onUpdate();
    } catch (error) {
      console.error("Error saving template FAQ:", error);
      toast.error("Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ Section</CardTitle>
        <CardDescription>
          Optimize your artist page for search engines and voice assistants with structured FAQs.
          Use the guided templates or create your own custom Q&A.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Guided Interview ({FAQ_TEMPLATES.filter(t => isTemplateAnswered(t.id)).length}/{FAQ_TEMPLATES.length})</TabsTrigger>
            <TabsTrigger value="custom">Custom Q&A ({faqs.filter(f => !FAQ_TEMPLATES.some(t => t.question === f.question)).length})</TabsTrigger>
          </TabsList>

          {/* Template Interview Tab */}
          <TabsContent value="templates" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Answer these SEO-optimized questions to help fans and search engines discover you.
            </p>
            {FAQ_TEMPLATES.map((template) => {
              const isAnswered = isTemplateAnswered(template.id);
              const currentAnswer = getTemplateAnswer(template.id);
              
              return (
                <Card key={template.id} className={isAnswered ? "border-primary/50" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {isAnswered ? (
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-base">{template.question}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {template.placeholder}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={isAnswered ? currentAnswer : (templateAnswers[template.id] || "")}
                      onChange={(e) => {
                        if (isAnswered) {
                          // Update existing FAQ
                          const existingFaq = faqs.find(f => f.question === template.question);
                          if (existingFaq) {
                            setTemplateAnswers(prev => ({ ...prev, [template.id]: e.target.value }));
                          }
                        } else {
                          setTemplateAnswers(prev => ({ ...prev, [template.id]: e.target.value }));
                        }
                      }}
                      placeholder={`Your answer here... ${template.placeholder}`}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {(isAnswered ? currentAnswer : (templateAnswers[template.id] || "")).length} characters
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleSaveTemplate(template)}
                        disabled={saving || (!templateAnswers[template.id] && !isAnswered)}
                      >
                        {saving ? "Saving..." : isAnswered ? "Update" : "Save"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Custom Q&A Tab */}
          <TabsContent value="custom" className="space-y-4 mt-4">
            {/* Custom FAQs */}
            {faqs.filter(f => !FAQ_TEMPLATES.some(t => t.question === f.question)).length > 0 && (
              <div className="space-y-2">
                {faqs
                  .filter(f => !FAQ_TEMPLATES.some(t => t.question === f.question))
                  .map((faq) => (
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


            {/* Add Custom FAQ Button */}
            {!editingFaq && (
              <Button onClick={handleAddNew} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Question
              </Button>
            )}


            {/* Custom FAQ Editing Form */}
            {editingFaq && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={editingFaq.question}
                    onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                    placeholder="Enter your custom FAQ question"
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
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
