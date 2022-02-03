import { useState, useEffect, useCallback } from "react";
import { range } from "../util/math";
import { useUid } from "../util/hooks";
import commonWords from "../data/common-words.json";
import "./Matrix.css";

// only get words with lower case letters and of certain length
const words = commonWords.filter(
  (word) => !word.match(/[^a-z]/) && word.length >= 4 && word.length <= 8
);

// util/convenient values/funcs
const randomWord = () => words[Math.floor(Math.random() * words.length)];
const maxLength = Math.max(...words.map((word) => word.length));
const randomPosition = () => Math.round(Math.random() * 100);

const timer = (func, period, delay) => {
  let interval;
  const timeout = window.setTimeout(
    () => (interval = window.setInterval(func, period)),
    delay * Math.random()
  );
  return () => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
  };
};

// text animation like the matrix
const Matrix = () => {
  const id = useUid("matrix");
  const [x, setX] = useState(randomPosition());
  const [y, setY] = useState(randomPosition());
  const [word, setWord] = useState(randomWord());

  const setRandomWord = useCallback(() => setWord(randomWord()), []);

  const setRandomPosition = useCallback(() => {
    setX(randomPosition());
    setY(randomPosition());
    document
      .getElementById(`matrix-${id}`)
      .getAnimations()
      .forEach((animation) => {
        animation.cancel();
        animation.play();
      });
  }, [id]);

  useEffect(() => {
    return timer(setRandomWord, 200, 200);
  }, [setRandomWord]);

  useEffect(() => {
    return timer(setRandomPosition, 2000, 2000);
  }, [setRandomPosition]);

  return (
    <div
      id={`matrix-${id}`}
      aria-hidden="true"
      className="matrix"
      style={{ left: x + "%", top: y + "%" }}
    >
      {range(maxLength).map((index) => (
        <span key={index}>{word[index]}</span>
      ))}
    </div>
  );
};

export default Matrix;
