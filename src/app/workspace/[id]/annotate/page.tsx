"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Save, 
  Brain,
  Tag,
  List,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface EntityAnnotation {
  start: number;
  end: number;
  entity: string;
  value: string;
}

interface SavedAnnotation {
  text: string;
  intent: string;
  entities: EntityAnnotation[];
  annotated_at: string;
}

export default function AnnotationToolPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  // Annotation form state
  const [text, setText] = useState('');
  const [intent, setIntent] = useState('');
  const [entityStart, setEntityStart] = useState('');
  const [entityEnd, setEntityEnd] = useState('');
  const [entityLabel, setEntityLabel] = useState('');
  const [entities, setEntities] = useState<EntityAnnotation[]>([]);

  // Saved annotations
  const [savedAnnotations, setSavedAnnotations] = useState<SavedAnnotation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(true);

  // Tokenization
  const [tokens, setTokens] = useState<{ text: string; start: number; end: number }[]>([]);

  useEffect(() => {
    fetchSavedAnnotations();
  }, [workspaceId]);

  useEffect(() => {
    if (text.trim()) {
      tokenizeText(text);
    } else {
      setTokens([]);
    }
  }, [text]);

  const fetchSavedAnnotations = async () => {
    try {
      setIsLoadingAnnotations(true);
      const response = await fetch(`http://localhost:8000/annotations/${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setSavedAnnotations(data.annotations || []);
      }
    } catch (error) {
      console.error('Failed to fetch annotations:', error);
    } finally {
      setIsLoadingAnnotations(false);
    }
  };

  const tokenizeText = async (inputText: string) => {
    try {
      const response = await fetch('http://localhost:8000/tokenize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens || []);
      }
    } catch (error) {
      console.error('Tokenization failed:', error);
    }
  };

  const addEntity = () => {
    const start = parseInt(entityStart);
    const end = parseInt(entityEnd);

    if (isNaN(start) || isNaN(end)) {
      toast.error('Entity start and end must be numbers');
      return;
    }

    if (start >= end) {
      toast.error('Entity start must be less than end');
      return;
    }

    if (start < 0 || end > text.length) {
      toast.error(`Entity indices must be between 0 and ${text.length}`);
      return;
    }

    if (!entityLabel.trim()) {
      toast.error('Entity label is required');
      return;
    }

    const value = text.substring(start, end);
    
    const newEntity: EntityAnnotation = {
      start,
      end,
      entity: entityLabel.trim(),
      value,
    };

    setEntities([...entities, newEntity]);
    setEntityStart('');
    setEntityEnd('');
    setEntityLabel('');
    toast.success(`Entity "${value}" added as "${entityLabel}"`);
  };

  const removeEntity = (index: number) => {
    setEntities(entities.filter((_, i) => i !== index));
    toast.success('Entity removed');
  };

  const saveAnnotation = async () => {
    if (!text.trim()) {
      toast.error('Text is required');
      return;
    }

    if (!intent.trim()) {
      toast.error('Intent is required');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('http://localhost:8000/annotations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: parseInt(workspaceId),
          text: text.trim(),
          intent: intent.trim(),
          entities,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save annotation');
      }

      const result = await response.json();
      toast.success('Annotation saved successfully!');

      // Add to saved annotations
      setSavedAnnotations([result.annotation, ...savedAnnotations]);

      // Reset form
      setText('');
      setIntent('');
      setEntities([]);
      setTokens([]);

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save annotation');
    } finally {
      setIsSaving(false);
    }
  };

  const selectTokenForEntity = (token: { text: string; start: number; end: number }) => {
    setEntityStart(token.start.toString());
    setEntityEnd(token.end.toString());
    toast.info(`Selected: "${token.text}" (${token.start}-${token.end})`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/workspace/${workspaceId}`}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Workspace
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="h-6 w-6 text-indigo-600" />
                  <h1 className="text-2xl font-bold">NLU Annotation Tool</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manually annotate training data with intents and entities
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Annotation Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Annotation</CardTitle>
                <CardDescription>
                  Annotate text with intent and entity labels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Text Input */}
                <div className="space-y-2">
                  <Label htmlFor="text">Text to Annotate</Label>
                  <textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter the text you want to annotate..."
                    className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Character count: {text.length}
                  </p>
                </div>

                {/* Intent Input */}
                <div className="space-y-2">
                  <Label htmlFor="intent">Intent Name</Label>
                  <Input
                    id="intent"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="e.g., greet, search_product, track_order"
                  />
                </div>

                {/* Tokenized Text Display */}
                {tokens.length > 0 && (
                  <div className="space-y-2">
                    <Label>Tokens (Click to Select for Entity)</Label>
                    <div className="border rounded-md p-3 bg-muted/30">
                      <div className="flex flex-wrap gap-2">
                        {tokens.map((token, index) => (
                          <button
                            key={index}
                            onClick={() => selectTokenForEntity(token)}
                            className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                            title={`${token.start}-${token.end}`}
                          >
                            {token.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Entity Annotation */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Add Entity
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="entity-start" className="text-xs">Start Index</Label>
                      <Input
                        id="entity-start"
                        type="number"
                        value={entityStart}
                        onChange={(e) => setEntityStart(e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="entity-end" className="text-xs">End Index</Label>
                      <Input
                        id="entity-end"
                        type="number"
                        value={entityEnd}
                        onChange={(e) => setEntityEnd(e.target.value)}
                        placeholder={text.length.toString()}
                        min="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="entity-label" className="text-xs">Entity Label</Label>
                      <Input
                        id="entity-label"
                        value={entityLabel}
                        onChange={(e) => setEntityLabel(e.target.value)}
                        placeholder="product"
                      />
                    </div>
                  </div>
                  <Button onClick={addEntity} variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entity
                  </Button>

                  {/* Current Entities */}
                  {entities.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs">Current Entities</Label>
                      <div className="space-y-2">
                        {entities.map((entity, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                "{entity.value}"
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entity.entity} • [{entity.start}-{entity.end}]
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEntity(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <Button
                  onClick={saveAnnotation}
                  disabled={isSaving || !text.trim() || !intent.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Annotation
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Saved Annotations */}
          <div className="space-y-6">
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Saved Annotations</CardTitle>
                    <CardDescription>
                      {savedAnnotations.length} annotation{savedAnnotations.length !== 1 ? 's' : ''} saved
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <List className="h-3 w-3 mr-1" />
                    {savedAnnotations.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  {isLoadingAnnotations ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                  ) : savedAnnotations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No annotations yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start annotating text on the left
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {savedAnnotations.map((annotation, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Text */}
                              <div>
                                <p className="text-sm font-medium mb-1">Text:</p>
                                <p className="text-sm bg-muted/50 p-2 rounded">
                                  {annotation.text}
                                </p>
                              </div>

                              {/* Intent */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Intent:</p>
                                <Badge variant="default">
                                  <Brain className="h-3 w-3 mr-1" />
                                  {annotation.intent}
                                </Badge>
                              </div>

                              {/* Entities */}
                              {annotation.entities.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Entities ({annotation.entities.length}):
                                  </p>
                                  <div className="space-y-1">
                                    {annotation.entities.map((entity, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <Badge variant="outline" className="text-xs">
                                          <Tag className="h-3 w-3 mr-1" />
                                          {entity.entity}
                                        </Badge>
                                        <span className="text-muted-foreground">
                                          "{entity.value}"
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Timestamp */}
                              <p className="text-xs text-muted-foreground">
                                {new Date(annotation.annotated_at).toLocaleString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
