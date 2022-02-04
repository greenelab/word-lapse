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
const randomPosition = () =>
  // linear/ramp random distribution that avoids center, i.e. "V" shape
  Math.floor(
    (Math.sqrt(Math.random()) * (Math.random() > 0.5 ? 1 : -1) * 0.5 + 0.5) *
      100
  );

// set interval with a random starting delay
const timer = (func, period, delay) => {
  let interval;
  const timeout = window.setTimeout(() => {
    interval = window.setInterval(func, period);
    func();
  }, delay * Math.random());
  return () => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
  };
};

// text animation like the matrix
const Matrix = () =>
  Array(15)
    .fill(0)
    .map((_, index) => <Word key={index} />);

export default Matrix;

// single word in animation
const Word = () => {
  const id = useUid("matrix");
  const [x, setX] = useState(-99999);
  const [y, setY] = useState(-99999);
  const [word, setWord] = useState("");

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
