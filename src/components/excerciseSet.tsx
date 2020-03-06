import { h, JSX } from "preact";
import { ISet } from "../models/types";

interface IProps {
  reps: ISet;
  completedReps?: number;
  onClick: () => void;
}

interface IStartedExcerciseSetProps {
  number: number;
  onClick: () => void;
}

interface INotStartedExcerciseSetProps {
  number: ISet;
  onClick: () => void;
}

export function ExcerciseSetView(props: IProps): JSX.Element {
  if (props.completedReps == null) {
    return <NotStartedExcerciseSet number={props.reps} onClick={props.onClick} />;
  } else {
    if (props.completedReps === props.reps) {
      return <CompleteExcerciseSet number={props.completedReps} onClick={props.onClick} />;
    } else {
      return <IncompleteExcerciseSet number={props.completedReps} onClick={props.onClick} />;
    }
  }
}

function NotStartedExcerciseSet(props: INotStartedExcerciseSetProps): JSX.Element {
  return (
    <button
      className="rounded-full border border-gray-400 bg-gray-300 text-center w-8 h-8 leading-7 mr-3"
      onClick={props.onClick}
    >
      {props.number}
    </button>
  );
}

function CompleteExcerciseSet(props: IStartedExcerciseSetProps): JSX.Element {
  return (
    <button
      className="rounded-full border border-green-400 bg-green-300 text-center w-8 h-8 leading-7 mr-3"
      onClick={props.onClick}
    >
      {props.number}
    </button>
  );
}

function IncompleteExcerciseSet(props: IStartedExcerciseSetProps): JSX.Element {
  return (
    <button
      className="rounded-full border border-red-400 bg-red-300 text-center w-8 h-8 leading-7 mr-3"
      onClick={props.onClick}
    >
      {props.number}
    </button>
  );
}