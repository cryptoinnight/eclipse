"use strict";

const { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } = React;
const { motion, AnimatePresence } = window.FramerMotion;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const RotatingText = forwardRef((props, ref) => {
  const {
    texts,
    transition = { type: "spring", damping: 25, stiffness: 300 },
    initial = { y: "100%", opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: "-120%", opacity: 0 },
    animatePresenceMode = "wait",
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = "first",
    loop = true,
    auto = true,
    splitBy = "characters",
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const splitIntoCharacters = (text) => {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (segment) => segment.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];
    const words = currentText.split(" ");
    return words.map((word, i) => ({
      characters: splitIntoCharacters(word),
      needsSpace: i !== words.length - 1,
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback((index, totalChars) => {
    const total = totalChars;
    if (staggerFrom === "first") return index * staggerDuration;
    if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
    if (staggerFrom === "center") {
      const center = Math.floor(total / 2);
      return Math.abs(center - index) * staggerDuration;
    }
    return Math.abs(staggerFrom - index) * staggerDuration;
  }, [staggerFrom, staggerDuration]);

  const next = useCallback(() => {
    setCurrentTextIndex((prevIndex) =>
      prevIndex === texts.length - 1 ? (loop ? 0 : prevIndex) : prevIndex + 1
    );
  }, [texts.length, loop]);

  useImperativeHandle(ref, () => ({ next }));

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(next, rotationInterval);
    return () => clearInterval(intervalId);
  }, [next, rotationInterval, auto]);

  return React.createElement(
    motion.span,
    { className: cn("text-rotate", mainClassName), ...rest },
    React.createElement(
      "span",
      { className: "text-rotate-sr-only" },
      texts[currentTextIndex]
    ),
    React.createElement(
      AnimatePresence,
      { mode: animatePresenceMode, initial: animatePresenceInitial },
      React.createElement(
        motion.div,
        {
          key: currentTextIndex,
          className: "text-rotate",
          ariaHidden: "true",
        },
        elements.map((wordObj, wordIndex, array) => {
          const previousCharsCount = array.slice(0, wordIndex).reduce((sum, word) => sum + word.characters.length, 0);
          return React.createElement(
            "span",
            { key: wordIndex, className: cn("text-rotate-word", splitLevelClassName) },
            wordObj.characters.map((char, charIndex) =>
              React.createElement(
                motion.span,
                {
                  key: charIndex,
                  initial,
                  animate,
                  exit,
                  transition: {
                    ...transition,
                    delay: getStaggerDelay(
                      previousCharsCount + charIndex,
                      array.reduce((sum, word) => sum + word.characters.length, 0)
                    ),
                  },
                  className: cn("text-rotate-element", elementLevelClassName),
                },
                char
              )
            ),
            wordObj.needsSpace && React.createElement("span", { className: "text-rotate-space" }, " ")
          );
        })
      )
    )
  );
});

function Learn_How() {
  return React.createElement(RotatingText, {
    texts: ["hi there 👋", "welcome to eclipse 🌘", "stay tuned 🔥"],
    auto: true,
    rotationInterval: 2000,
  });
}

// render to DOM
ReactDOM.render(
  React.createElement(Learn_How),
  document.getElementById("starting_learn_how_container")
);
