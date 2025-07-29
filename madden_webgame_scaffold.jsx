import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';

const plays = [
  { id: 'run_left', name: 'Run Left' },
  { id: 'run_right', name: 'Run Right' },
  { id: 'pass_short', name: 'Pass - Short' },
  { id: 'pass_long', name: 'Pass - Long' },
  { id: 'defense_blitz', name: 'Blitz Defense' },
  { id: 'defense_zone', name: 'Zone Coverage' },
];

export default function App() {
  const [selectedPlay, setSelectedPlay] = useState(null);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [gameTime, setGameTime] = useState(300); // 5 minutes in seconds
  const [gameOver, setGameOver] = useState(false);
  const playerRef = useRef();
  const defenderRef = useRef();

  useEffect(() => {
    if (gameTime === 0) setGameOver(true);
    const timer = setInterval(() => {
      setGameTime((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useFrame(() => {
    if (!playerRef.current || !defenderRef.current) return;

    // Touchdown check
    if (playerRef.current.position.z < -45) {
      setScore((prev) => ({ ...prev, home: prev.home + 7 }));
      playerRef.current.position.z = 0;
      playerRef.current.position.x = 0;
      defenderRef.current.position.set(0, 0.5, -20);
    }

    // AI Chasing logic
    const direction = new THREE.Vector3()
      .subVectors(playerRef.current.position, defenderRef.current.position)
      .normalize()
      .multiplyScalar(0.05);
    defenderRef.current.position.add(direction);

    // Collision check
    const distance = playerRef.current.position.distanceTo(defenderRef.current.position);
    if (distance < 1.5) {
      setScore((prev) => ({ ...prev, away: prev.away + 7 }));
      playerRef.current.position.set(0, 0.5, 0);
      defenderRef.current.position.set(0, 0.5, -20);
    }
  });

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-screen flex">
      <div className="w-1/4 p-4 bg-gray-100 border-r">
        <h2 className="text-xl font-bold mb-2">Play Selection</h2>
        <div className="flex flex-col gap-2">
          {plays.map((play) => (
            <Button
              key={play.id}
              variant={selectedPlay === play.id ? 'default' : 'outline'}
              onClick={() => setSelectedPlay(play.id)}
              disabled={gameOver}
            >
              {play.name}
            </Button>
          ))}
        </div>
        {selectedPlay && <div className="mt-4 text-sm text-gray-600">Selected: {selectedPlay}</div>}
        <div className="mt-8">
          <h3 className="font-semibold">Scoreboard</h3>
          <p>Home: {score.home}</p>
          <p>Away: {score.away}</p>
          <p>Time Left: {formatTime(gameTime)}</p>
          {gameOver && <p className="text-red-500 mt-2 font-bold">Game Over</p>}
        </div>
      </div>

      <div className="w-3/4 h-full">
        <Canvas camera={{ position: [0, 15, 25], fov: 50 }} shadows>
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
          <FootballField />
          <Player ref={playerRef} position={[0, 0.5, 0]} />
          <Defender ref={defenderRef} position={[0, 0.5, -20]} />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}

function FootballField() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 100]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
}

const Player = React.forwardRef(({ position = [0, 0.5, 0] }, ref) => {
  const meshRef = useRef();
  const velocity = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const keys = window._pressedKeys || {};
    const speed = 10;
    velocity.current.set(0, 0, 0);

    if (keys['w']) velocity.current.z -= speed * delta;
    if (keys['s']) velocity.current.z += speed * delta;
    if (keys['a']) velocity.current.x -= speed * delta;
    if (keys['d']) velocity.current.x += speed * delta;

    if (meshRef.current) {
      meshRef.current.position.add(velocity.current);
    }
  });

  useEffect(() => {
    if (ref) ref.current = meshRef.current;
  }, [ref]);

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
});

const Defender = React.forwardRef(({ position = [0, 0.5, -20] }, ref) => {
  const meshRef = useRef();

  useEffect(() => {
    if (ref) ref.current = meshRef.current;
  }, [ref]);

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
});

if (typeof window !== 'undefined') {
  window._pressedKeys = {};
  window.addEventListener('keydown', (e) => {
    window._pressedKeys[e.key.toLowerCase()] = true;
  });
  window.addEventListener('keyup', (e) => {
    window._pressedKeys[e.key.toLowerCase()] = false;
  });
}
