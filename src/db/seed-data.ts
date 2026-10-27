import { Exercise } from './schema';

export const SEED_EXERCISES: Exercise[] = [
  // --- BODYWEIGHT: CHEST & TRICEPS ---
  {
    id: 'push-up',
    name: 'Standard Push-Up',
    category: 'strength',
    equipment: 'body only',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders', 'abdominals'],
    instructions: [
      'Place your hands shoulder-width apart on the floor with your legs straight behind you.',
      'Engage your core to maintain a neutral spine from heels to head.',
      'Lower your chest until your elbows reach approximately a 90-degree angle.',
      'Press firmly through your palms to return to the starting plank position.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'diamond-push-up',
    name: 'Diamond Push-Up',
    category: 'strength',
    equipment: 'body only',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'shoulders'],
    instructions: [
      'Set up in a standard push-up plank position.',
      'Bring your hands close together beneath your chest, touching thumbs and index fingers to form a diamond.',
      'Lower your chest toward your hands while keeping your elbows tucked close to your torso.',
      'Push back up using triceps power to lockout.'
    ],
    level: 'intermediate',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'bench-dip',
    name: 'Bench / Chair Dip',
    category: 'strength',
    equipment: 'body only',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'shoulders'],
    instructions: [
      'Sit on the edge of a sturdy bench or chair, placing hands next to hips with fingers forward.',
      'Slide your hips forward off the bench with knees bent or extended.',
      'Lower your body by bending elbows until upper arms are parallel to floor.',
      'Drive through your palms to extend elbows back to top position.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },

  // --- BODYWEIGHT: BACK & BICEPS ---
  {
    id: 'pull-up',
    name: 'Overhand Pull-Up',
    category: 'strength',
    equipment: 'pull-up bar',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'middle back', 'shoulders'],
    instructions: [
      'Grip the pull-up bar with an overhand (pronated) grip slightly wider than shoulder-width.',
      'Hang with arms fully extended and engage your lats and core.',
      'Pull your chest up toward the bar, driving your elbows down and back.',
      'Pause when your chin clears the bar, then lower under control.'
    ],
    level: 'intermediate',
    force: 'pull',
    mechanic: 'compound'
  },
  {
    id: 'chin-up',
    name: 'Underhand Chin-Up',
    category: 'strength',
    equipment: 'pull-up bar',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['lats', 'middle back'],
    instructions: [
      'Grasp the bar with an underhand (supinated) grip at shoulder-width.',
      'Pull upwards until your chin is level with or above the bar.',
      'Focus on flexing the biceps and contracting the back muscles.',
      'Lower slowly to a dead hang.'
    ],
    level: 'intermediate',
    force: 'pull',
    mechanic: 'compound'
  },

  // --- BODYWEIGHT: SHOULDERS ---
  {
    id: 'pike-push-up',
    name: 'Pike Push-Up',
    category: 'strength',
    equipment: 'body only',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'upper back'],
    instructions: [
      'Begin in a standard push-up position, then walk your feet forward and lift your hips into an inverted V shape.',
      'Keep your legs as straight as comfortable and hands shoulder-width apart.',
      'Lower the top of your head diagonally toward the floor between your hands.',
      'Press through shoulders and triceps back to the inverted pike peak.'
    ],
    level: 'intermediate',
    force: 'push',
    mechanic: 'compound'
  },

  // --- BODYWEIGHT: LEGS & GLUTES ---
  {
    id: 'air-squat',
    name: 'Bodyweight Air Squat',
    category: 'strength',
    equipment: 'body only',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes', 'hamstrings', 'calves'],
    instructions: [
      'Stand with feet shoulder-width apart, toes pointing slightly outward.',
      'Initiate movement by sending hips back and bending knees.',
      'Descend until thighs are parallel or below parallel to the floor.',
      'Drive through whole foot to stand back up tall.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'walking-lunge',
    name: 'Walking Bodyweight Lunge',
    category: 'strength',
    equipment: 'body only',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    instructions: [
      'Step forward with your lead leg and lower your hips until both knees form 90-degree angles.',
      'Keep your front knee stacked over your front ankle.',
      'Drive off front heel to step the trailing leg forward into the next repetition.',
      'Alternate legs smoothly.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'bulgarian-split-squat-bw',
    name: 'Bulgarian Split Squat (Bodyweight)',
    category: 'strength',
    equipment: 'body only',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    instructions: [
      'Stand two feet in front of a bench or couch, placing the top of one foot on the surface behind you.',
      'Keep torso upright and descend until front thigh is parallel to the ground.',
      'Push through your front heel to rise back to the start.'
    ],
    level: 'intermediate',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'strength',
    equipment: 'body only',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'lower back'],
    instructions: [
      'Lie face up on the floor with knees bent and feet flat on the floor hip-width apart.',
      'Drive your hips upward towards the ceiling by squeezing your glutes.',
      'Form a straight diagonal line from knees to shoulders at the top.',
      'Hold for a 1-second squeeze, then lower smoothly.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'isolation'
  },

  // --- BODYWEIGHT: CORE ---
  {
    id: 'plank',
    name: 'Forearm Plank',
    category: 'strength',
    equipment: 'body only',
    primaryMuscles: ['abdominals'],
    secondaryMuscles: ['shoulders', 'lower back', 'glutes'],
    instructions: [
      'Place forearms on the floor with elbows directly under shoulders.',
      'Extend legs straight out behind you, resting on toes.',
      'Engage glutes and pull navel toward spine to maintain a flat back.',
      'Hold tension steadily without arching or sagging.'
    ],
    level: 'beginner',
    force: 'static',
    mechanic: 'isolation'
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'cardio',
    equipment: 'body only',
    primaryMuscles: ['abdominals'],
    secondaryMuscles: ['shoulders', 'quadriceps', 'cardiovascular system'],
    instructions: [
      'Start in a push-up plank position.',
      'Rapidly drive one knee up toward your chest while keeping hips down.',
      'Quickly switch legs, extending the first back while driving the other forward.',
      'Maintain a swift, continuous jogging cadence.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },

  // --- DUMBBELL: CHEST & SHOULDERS ---
  {
    id: 'dumbbell-floor-press',
    name: 'Dumbbell Floor Press',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    instructions: [
      'Lie flat on the floor with knees bent and a dumbbell in each hand at chest level.',
      'Elbows should rest on the floor at roughly a 45-degree angle to your ribs.',
      'Press both dumbbells straight up over your chest until arms are locked out.',
      'Lower under control until upper arms gently touch the carpet/floor, then repeat.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Flat Dumbbell Bench Press',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    instructions: [
      'Lie flat on a workout bench holding dumbbells at chest height with palms forward.',
      'Press the dumbbells up until arms are fully extended over chest.',
      'Inhale and lower slowly until dumbbells are level with chest.',
      'Explode upwards to starting position.'
    ],
    level: 'intermediate',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Seated / Standing Dumbbell Shoulder Press',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'upper back'],
    instructions: [
      'Hold a dumbbell in each hand at shoulder height with palms facing forward.',
      'Engage core and press weights directly overhead in an arc until arms lock.',
      'Lower weights smoothly back to ear/shoulder level.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['upper back'],
    instructions: [
      'Stand tall holding light dumbbells at your sides with palms inward.',
      'With a slight bend in elbows, raise arms outward to sides until parallel to floor.',
      'Pause briefly at parallel, then lower with control.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'isolation'
  },

  // --- DUMBBELL: BACK & BICEPS & TRICEPS ---
  {
    id: 'dumbbell-row',
    name: 'One-Arm Dumbbell Row',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['middle back', 'biceps', 'shoulders'],
    instructions: [
      'Place one knee and one hand on a bench or sturdy chair for support.',
      'Hold a dumbbell in opposite hand with arm hanging straight down.',
      'Pull the dumbbell upward towards your hip, driving elbow to ceiling.',
      'Squeeze lat at the top, then lower under control.'
    ],
    level: 'beginner',
    force: 'pull',
    mechanic: 'compound'
  },
  {
    id: 'dumbbell-bicep-curl',
    name: 'Standing Dumbbell Bicep Curl',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    instructions: [
      'Stand upright holding dumbbells at sides, palms facing forward.',
      'Keeping upper arms stationary, curl weights up toward shoulders.',
      'Squeeze biceps at the top contraction for one count.',
      'Lower slowly back to full extension.'
    ],
    level: 'beginner',
    force: 'pull',
    mechanic: 'isolation'
  },
  {
    id: 'dumbbell-hammer-curl',
    name: 'Dumbbell Hammer Curl',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    instructions: [
      'Hold dumbbells with neutral grip (palms facing each other) at sides.',
      'Curl weights upward while maintaining the neutral thumb-up grip.',
      'Lower with control to complete the rep.'
    ],
    level: 'beginner',
    force: 'pull',
    mechanic: 'isolation'
  },
  {
    id: 'dumbbell-overhead-tricep-extension',
    name: 'Overhead Dumbbell Tricep Extension',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['shoulders'],
    instructions: [
      'Grip one heavy dumbbell with both hands overhead with arms straight.',
      'Keep elbows pointing forward and bend elbows to lower weight behind head.',
      'Extend arms fully using triceps to lift the weight back overhead.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'isolation'
  },

  // --- DUMBBELL: LEGS ---
  {
    id: 'dumbbell-goblet-squat',
    name: 'Dumbbell Goblet Squat',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes', 'hamstrings', 'abdominals'],
    instructions: [
      'Hold a single dumbbell vertically against your sternum with both hands cupping the top head.',
      'Squat deeply, pushing knees outward in line with your toes.',
      'Lower until elbows brush inside of knees.',
      'Drive through mid-foot to stand back up.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'dumbbell-romanian-deadlift',
    name: 'Dumbbell Romanian Deadlift',
    category: 'strength',
    equipment: 'dumbbell',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes', 'lower back'],
    instructions: [
      'Stand tall holding a pair of dumbbells in front of your thighs.',
      'Hinge at hips, pushing glutes backward with a slight knee bend.',
      'Lower dumbbells down shins until you feel a deep hamstring stretch.',
      'Drive hips forward to return to standing lockout.'
    ],
    level: 'intermediate',
    force: 'pull',
    mechanic: 'compound'
  },

  // --- RESISTANCE BANDS ---
  {
    id: 'band-pull-apart',
    name: 'Band Pull-Apart',
    category: 'strength',
    equipment: 'bands',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['middle back'],
    instructions: [
      'Hold a resistance band horizontally at chest level with arms extended forward.',
      'Pull the band apart by retracting shoulder blades until band touches chest.',
      'Pause for 1 second, then control back to start.'
    ],
    level: 'beginner',
    force: 'pull',
    mechanic: 'isolation'
  },
  {
    id: 'band-face-pull',
    name: 'Banded Face Pull',
    category: 'strength',
    equipment: 'bands',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['middle back', 'traps'],
    instructions: [
      'Anchor band at eye level to a door frame or post.',
      'Grasp band with both hands and pull toward eye level, flaring elbows high and back.',
      'Squeeze rear deltoids and upper back, then release slowly.'
    ],
    level: 'beginner',
    force: 'pull',
    mechanic: 'compound'
  },
  {
    id: 'band-bicep-curl',
    name: 'Banded Bicep Curl',
    category: 'strength',
    equipment: 'bands',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    instructions: [
      'Step firmly on the middle of the resistance band with both feet.',
      'Hold handles or ends with palms facing upward.',
      'Curl upward against increasing tension towards shoulders.',
      'Lower slowly under continuous band tension.'
    ],
    level: 'beginner',
    force: 'pull',
    mechanic: 'isolation'
  },

  // --- KETTLEBELL ---
  {
    id: 'kettlebell-swing',
    name: 'Two-Handed Kettlebell Swing',
    category: 'strength',
    equipment: 'kettlebells',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'lower back', 'shoulders'],
    instructions: [
      'Hinge at hips with kettlebell slightly in front of you.',
      'Hike kettlebell between legs, then snap hips forward forcefully.',
      'Allow bell to float up to chest level with relaxed arms.',
      'Guide bell back into hip hinge and repeat continuously.'
    ],
    level: 'intermediate',
    force: 'pull',
    mechanic: 'compound'
  },

  // --- CARDIO / HOME GEAR ---
  {
    id: 'walking-pad-session',
    name: 'Walking Pad Zone 2 Brisk Walk',
    category: 'cardio',
    equipment: 'walking pad',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['quadriceps', 'calves'],
    instructions: [
      'Step onto walking pad at moderate brisk pace (4.0 - 5.5 km/h).',
      'Keep posture upright with shoulders relaxed and arms swinging naturally.',
      'Breathe steadily through nose for sustained aerobic endurance.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    category: 'cardio',
    equipment: 'body only',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['calves', 'shoulders'],
    instructions: [
      'Stand upright with feet together and arms at sides.',
      'Jump feet outward while swinging arms overhead to touch palms.',
      'Immediately jump back to starting stance and repeat at rhythm.'
    ],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound'
  },
  {
    id: 'burpees',
    name: 'Standard Burpee',
    category: 'plyometrics',
    equipment: 'body only',
    primaryMuscles: ['cardiovascular system'],
    secondaryMuscles: ['chest', 'quadriceps', 'abdominals'],
    instructions: [
      'From standing, drop into a squat and place hands on floor.',
      'Kick feet back into a push-up plank, perform a push-up.',
      'Immediately jump feet back to hands.',
      'Explode upward into a vertical jump with hands clapping overhead.'
    ],
    level: 'intermediate',
    force: 'push',
    mechanic: 'compound'
  }
];
