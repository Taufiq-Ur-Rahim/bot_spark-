import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';

function QuestionCard({ question, answer, onAnswerChange, onVoiceInput, onVoiceOutput }) {
  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <Badge bg="info" className="me-2">{question.topic}</Badge>
            <Badge bg="secondary">{question.difficulty}</Badge>
          </div>
          <div>
            <Button variant="outline-primary" size="sm" onClick={onVoiceOutput}>🔊</Button>
          </div>
        </div>
        <Card.Title>{question.text}</Card.Title>
        <input
          className="form-control mt-3"
          value={answer}
          onChange={e => onAnswerChange(e.target.value)}
          placeholder="Type or use voice input"
        />
        <Button variant="outline-success" className="mt-2" onClick={onVoiceInput}>🎤 Answer by Voice</Button>
      </Card.Body>
    </Card>
  );
}

export default QuestionCard; 