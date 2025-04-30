import { FC } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export interface ExamQuestionEditorProps {
  question: {
    id: string;
    type: 'multiple-choice' | 'true-false';
    label: string;
    required: boolean;
    choices: { id: string; text: string; correct: boolean }[];
    estimationTime: number;
    points: number;
  };
  onChange: (q: any) => void;
  onDelete: () => void;
}

const ExamQuestionEditor: FC<ExamQuestionEditorProps> = ({ question, onChange, onDelete }) => {
  // UI for editing the question, choices, required toggle, etc.
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Input
            className="text-lg font-semibold border-none shadow-none"
            value={question.label}
            onChange={e => onChange({ ...question, label: e.target.value })}
            placeholder="Enter your question..."
          />
          <Button variant="destructive" onClick={onDelete}>Delete</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm">Required</span>
          <Switch checked={question.required} onCheckedChange={v => onChange({ ...question, required: v })} />
        </div>
        {question.type === 'multiple-choice' && (
          <div className="space-y-2 mb-4">
            {question.choices.map((c, idx) => (
              <div key={c.id} className="flex items-center space-x-2">
                <Checkbox checked={c.correct} onCheckedChange={v => {
                  const updated = question.choices.map((ch, i) => i === idx ? { ...ch, correct: v } : ch);
                  onChange({ ...question, choices: updated });
                }} />
                <Input
                  className="flex-1"
                  value={c.text}
                  onChange={e => {
                    const updated = question.choices.map((ch, i) => i === idx ? { ...ch, text: e.target.value } : ch);
                    onChange({ ...question, choices: updated });
                  }}
                  placeholder={`Choice ${idx + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = question.choices.filter((_, i) => i !== idx);
                    onChange({ ...question, choices: updated });
                  }}
                >
                  🗑️
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({
                ...question,
                choices: [
                  ...question.choices,
                  { id: `choice-${Date.now()}`, text: '', correct: false }
                ]
              })}
            >
              + Add answers
            </Button>
          </div>
        )}
        {question.type === 'true-false' && (
          <div className="flex space-x-4 mb-4">
            {[true, false].map(val => (
              <Button
                key={val ? 'true' : 'false'}
                variant={question.choices[0]?.correct === val ? 'default' : 'outline'}
                onClick={() => onChange({
                  ...question,
                  choices: [
                    { id: 'true', text: 'True', correct: val },
                    { id: 'false', text: 'False', correct: !val }
                  ]
                })}
              >
                {val ? 'True' : 'False'}
              </Button>
            ))}
          </div>
        )}
        <div className="flex space-x-4 mt-4">
          <div>
            <span className="block text-xs mb-1">Estimation time</span>
            <Input
              type="number"
              min={1}
              value={question.estimationTime}
              onChange={e => onChange({ ...question, estimationTime: Number(e.target.value) })}
              className="w-20"
            />
          </div>
          <div>
            <span className="block text-xs mb-1">Points</span>
            <Input
              type="number"
              min={1}
              value={question.points}
              onChange={e => onChange({ ...question, points: Number(e.target.value) })}
              className="w-20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamQuestionEditor;
