import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Target
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

export default function FocusAreas({ weakTopics = [] }) {
  const hasWeakTopics = Array.isArray(weakTopics) && weakTopics.length > 0;

  return (
    <Card className="p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-heading flex items-center gap-2">
            <Target className="h-4 w-4 text-rose-500" />
            Focus Areas
          </h2>
          <p className="text-xs text-muted">
            Topics prioritized by error rates and difficulty weighting
          </p>
        </div>

        {hasWeakTopics && (
          <Link
            to="/analytics"
            className="text-xs text-indigo-500 hover:opacity-80 font-medium inline-flex items-center gap-1 transition"
          >
            All Weak Areas <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Content */}
      {!hasWeakTopics ? (
        <div className="p-6 rounded-xl card-base border border-subtle text-center">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-heading">You're doing well! 🎉</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
            No critical weak topics have been identified. Keep practicing quizzes to maintain mastery and detect emerging focus areas.
          </p>
          <div className="mt-4">
            <Link to="/quizzes">
              <Button variant="outline" size="xs">
                Take a Quiz
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {weakTopics.slice(0, 3).map((topic, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl card-base border border-subtle hover:border-indigo-500/40 transition space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="indigo" size="xs">
                      {topic.moduleCode}
                    </Badge>
                    <span className="text-xs font-semibold text-heading truncate max-w-xs">
                      {topic.topic}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="text-rose-500 font-medium">
                      Accuracy: {topic.accuracy}%
                    </span>
                    <span>&bull;</span>
                    <span>{topic.incorrect} mistakes / {topic.totalQuestions} items</span>
                  </div>
                </div>

                <Badge
                  variant={topic.priority === 'HIGH' ? 'rose' : 'amber'}
                  size="xs"
                >
                  {topic.priority} Priority
                </Badge>
              </div>

              {/* Recommendation snippet */}
              {topic.recommendation && (
                <p className="text-[11px] text-muted italic line-clamp-1 border-t border-subtle pt-2">
                  "{topic.recommendation}"
                </p>
              )}

              <div className="pt-1 flex items-center justify-end">
                <Link to={`/questions?topic=${encodeURIComponent(topic.topic)}`}>
                  <Button variant="ghost" size="xs" className="!px-2 !py-1 text-indigo-500 font-medium">
                    Practice Topic <ArrowRight className="h-3 w-3 ml-1 inline" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
