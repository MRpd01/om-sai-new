"use client";

import { useEffect, useState } from 'react';

interface FloatingFood {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  animationType: string;
}

export default function FloatingFoodElements() {
  const [foods, setFoods] = useState<FloatingFood[]>([]);

  const foodEmojis = [
    '🍛', // Curry
    '🍲', // Hot pot
    '🥘', // Paella/curry pan
    '🍚', // Cooked rice
    '🫓', // Flatbread/roti/naan
    '🥗', // Green salad
    '🍅', // Tomato
    '🥕', // Carrot
    '🥔', // Potato
    '🧅', // Onion
    '🫑', // Bell pepper
    '🌶️', // Hot pepper/chili
    '�', // Garlic
    '�🧈', // Butter/ghee
    '🥛', // Glass of milk
    '☕', // Hot beverage/chai
    '🍵', // Teacup
    '🫚', // Ginger
    '🥜', // Peanuts/groundnut
    '🌽', // Corn/makai
    '🥒', // Cucumber
    '🍋', // Lemon
    '🫘', // Beans/rajma
    '🌾', // Sheaf of rice/wheat
  ];

  const animations = [
    'animate-float-3d',
    'animate-float-slow-3d',
    'animate-float-reverse-3d',
    'animate-spin-wobble',
    'animate-bounce-rotate',
    'animate-rotate-3d-axis',
    'animate-float-orbit',
    'animate-sizzle',
  ];

  useEffect(() => {
    const generatedFoods: FloatingFood[] = foodEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      x: Math.random() * 90, // 0-90% to keep within viewport
      y: Math.random() * 90,
      size: Math.random() * 2 + 2, // 2-4rem
      duration: Math.random() * 6 + 8, // 8-14s
      delay: Math.random() * 3, // 0-3s delay
      animationType: animations[Math.floor(Math.random() * animations.length)]
    }));

    setFoods(generatedFoods);
  }, []);

  return (
    <div className="floating-food-container">
      {foods.map((food) => (
        <div
          key={food.id}
          className={`food-emoji-3d ${food.animationType}`}
          style={{
            left: `${food.x}%`,
            top: `${food.y}%`,
            fontSize: `${food.size}rem`,
            animationDuration: `${food.duration}s`,
            animationDelay: `${food.delay}s`,
          }}
        >
          {food.emoji}
        </div>
      ))}
    </div>
  );
}
