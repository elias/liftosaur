import { IDayData, IPlannerProgram, IPlannerProgramDay, IPlannerProgramWeek, ISettings } from "../../types";
import { PlannerProgram } from "./models/plannerProgram";
import { PlannerKey } from "./plannerKey";
import { IPlannerEvalResult, IPlannerTopLineItem } from "./plannerExerciseEvaluator";
import { IPlannerProgramExerciseSet, IPlannerProgramExerciseWarmupSet } from "./models/types";
import { Weight } from "../../models/weight";
import { ObjectUtils } from "../../utils/object";

export class PlannerEvaluatedProgramToText {
  constructor(
    private readonly plannerProgram: IPlannerProgram,
    private readonly newEvaluatedWeeks: IPlannerEvalResult[][],
    private readonly settings: ISettings
  ) {}

  private reorderTopLine(
    topLine: IPlannerTopLineItem[][][],
    reorder: { dayData: Required<IDayData>; fromIndex: number; toIndex: number }
  ): IPlannerTopLineItem[][][] {
    const groupedTopLine: IPlannerTopLineItem[][][][] = [];
    for (let weekIndex = 0; weekIndex < topLine.length; weekIndex += 1) {
      const topLineWeek = topLine[weekIndex];
      groupedTopLine.push([]);
      for (let dayInWeekIndex = 0; dayInWeekIndex < topLineWeek.length; dayInWeekIndex += 1) {
        const topLineDay = topLineWeek[dayInWeekIndex];
        const group: IPlannerTopLineItem[][] = [];
        groupedTopLine[weekIndex].push(group);
        let reset = true;
        for (let lineIndex = 0; lineIndex < topLineDay.length; lineIndex += 1) {
          if (reset) {
            group.push([]);
            reset = false;
          }
          const line = topLineDay[lineIndex];
          group[group.length - 1] = group[group.length - 1] || [];
          group[group.length - 1].push(line);
          if (line.type === "exercise") {
            reset = true;
          }
        }
      }
    }

    const groupedDay = groupedTopLine[reorder.dayData.week - 1][reorder.dayData.dayInWeek - 1];
    const from = groupedDay[reorder.fromIndex];
    groupedDay.splice(reorder.fromIndex, 1);
    groupedDay.splice(reorder.toIndex, 0, from);

    const newTopLine: IPlannerTopLineItem[][][] = [];
    for (const week of groupedTopLine) {
      newTopLine.push([]);
      for (const day of week) {
        newTopLine[newTopLine.length - 1].push(day.flat());
      }
    }

    return newTopLine;
  }

  public run(reorder?: { dayData: Required<IDayData>; fromIndex: number; toIndex: number }): IPlannerProgram {
    const plannerWeeks: IPlannerProgramWeek[] = [];
    let topLineMap = ObjectUtils.clone(PlannerProgram.topLineItems(this.plannerProgram, this.settings));
    topLineMap = reorder ? this.reorderTopLine(topLineMap, reorder) : topLineMap;
    const addedProgressMap: Record<string, boolean> = {};
    const addedUpdateMap: Record<string, boolean> = {};
    const addedWarmupsMap: Record<string, boolean> = {};
    const addedIdMap: Record<string, boolean> = {};

    for (let weekIndex = 0; weekIndex < this.plannerProgram.weeks.length; weekIndex += 1) {
      const week = this.plannerProgram.weeks[weekIndex];
      const plannerWeek: IPlannerProgramWeek = { name: week.name, days: [] };
      for (let dayInWeekIndex = 0; dayInWeekIndex < week.days.length; dayInWeekIndex += 1) {
        const topLines = topLineMap[weekIndex][dayInWeekIndex];
        const weekDay = week.days[dayInWeekIndex];
        const plannerDay: IPlannerProgramDay = { name: weekDay.name, exerciseText: "" };
        const exerciseTextArr: string[] = [];
        for (let lineIndex = 0; lineIndex < topLines.length; lineIndex += 1) {
          const line = topLines[lineIndex];
          switch (line.type) {
            case "comment": {
              exerciseTextArr.push(line.value);
              break;
            }
            case "description": {
              exerciseTextArr.push(line.value);
              break;
            }
            case "empty": {
              exerciseTextArr.push("");
              break;
            }
            case "exercise": {
              const evalDay = this.newEvaluatedWeeks[weekIndex][dayInWeekIndex];
              const evalExercise = evalDay.success ? evalDay.data.find((e) => e.key === line.value) : undefined;
              if (!evalExercise || evalExercise.isRepeat) {
                break;
              }
              const key = PlannerKey.fromFullName(evalExercise.fullName, this.settings);
              let plannerExercise = "";
              plannerExercise += evalExercise.fullName;
              const orderAndRepeat: string[] = [];
              if (evalExercise.order !== 0) {
                orderAndRepeat.push(`${evalExercise.order}`);
              }
              if (evalExercise.repeat.length > 0) {
                const from = evalExercise.repeat[0];
                const to = evalExercise.repeat[evalExercise.repeat.length - 1];
                orderAndRepeat.push(`${from}-${to}`);
              }
              if (orderAndRepeat.length > 0) {
                plannerExercise += `[${orderAndRepeat.join(",")}]`;
              }
              if (evalExercise.notused) {
                plannerExercise += " / used: none";
              }
              const reuse = evalExercise.reuse;
              if (reuse) {
                let reusedKey = reuse.fullName;
                if (reuse.week != null || reuse.day != null) {
                  reusedKey += reuse.week == null ? `[${reuse.day}]` : `[${reuse.week}:${reuse.day ?? "_"}]`;
                }
                plannerExercise += ` / ...${reusedKey}`;
              }
              if (evalExercise.setVariations.length > 0) {
                plannerExercise +=
                  ` / ` + evalExercise.setVariations.map((v) => this.setsToString(v.sets, v.isCurrent)).join(" / ");
              }

              if (reuse && evalExercise.setVariations.length === 0) {
                const globals = evalExercise.globals;
                if (globals.weight != null) {
                  plannerExercise += ` / ${Weight.print(globals.weight)}${globals.askWeight ? "+" : ""}`;
                } else if (globals.percentage != null) {
                  plannerExercise += ` / ${globals.percentage}%${globals.askWeight ? "+" : ""}`;
                }
                if (globals.rpe != null) {
                  plannerExercise += ` / @${globals.rpe}${globals.logRpe ? "+" : ""}`;
                }
                if (globals.timer != null) {
                  plannerExercise += ` / ${globals.timer}s`;
                }
              }

              if (!addedWarmupsMap[key] && evalExercise.warmupSets) {
                const warmupSets = this.getWarmupSets(evalExercise.warmupSets);
                plannerExercise += ` / warmup: ${warmupSets}`;
              }
              addedWarmupsMap[key] = true;

              if (!addedIdMap[key] && (evalExercise.tags || []).length > 0) {
                plannerExercise += ` / id: tags(${evalExercise.tags.join(", ")})`;
                addedIdMap[key] = true;
              }

              const update = evalExercise.properties.find((p) => p.name === "update");
              if (!addedUpdateMap[key] && update != null && (update.body || update.script)) {
                plannerExercise += ` / update: ${update.fnName}(${update.fnArgs.join(", ")})`;
                if (update.body) {
                  plannerExercise += ` { ...${update.body} }`;
                } else if (update.script) {
                  plannerExercise += ` ${update.script}`;
                }
                addedUpdateMap[key] = true;
              }

              const progress = evalExercise.properties.find((p) => p.name === "progress");
              if (progress != null) {
                if (progress.fnName === "none") {
                  plannerExercise += ` / progress: none`;
                } else if (!addedProgressMap[key]) {
                  plannerExercise += ` / progress: ${progress.fnName}(${progress.fnArgs.join(", ")})`;
                  if (progress.body) {
                    plannerExercise += ` { ...${progress.body} }`;
                  } else if (progress.script) {
                    plannerExercise += ` ${progress.script}`;
                  }
                  addedProgressMap[key] = true;
                }
              }
              exerciseTextArr.push(plannerExercise);
              break;
            }
          }
        }
        plannerDay.exerciseText = exerciseTextArr.join("\n");
        plannerWeek.days.push(plannerDay);
      }
      plannerWeeks.push(plannerWeek);
    }
    const result: IPlannerProgram = { name: this.plannerProgram.name, weeks: plannerWeeks };
    return PlannerProgram.compact(result, this.settings);
  }

  private setsToString(sets: IPlannerProgramExerciseSet[], isCurrent: boolean): string {
    const addQuickAddSet = sets.some((s) => !!s.repRange?.isQuickAddSet);
    const result: string[] = [];
    for (const set of sets) {
      let setStr = "";
      const repRange = set.repRange;
      if (repRange == null) {
        continue;
      }
      setStr += `${repRange.numberOfSets}${addQuickAddSet ? "+" : ""}x`;
      setStr += repRange.minrep !== repRange.maxrep ? `${Math.max(0, repRange.minrep)}-` : "";
      setStr += `${Math.max(0, repRange.maxrep)}`;
      setStr += repRange.isAmrap ? "+" : "";
      const weightValue =
        set.weight != null ? Weight.print(set.weight) : set.percentage != null ? `${set.percentage}%` : undefined;
      setStr += weightValue ? ` ${weightValue}${set.askWeight ? "+" : ""}` : "";
      setStr += set.rpe != null ? ` @${Math.max(0, set.rpe)}` : "";
      setStr += set.rpe != null && set.logRpe ? "+" : "";
      setStr += set.timer != null ? ` ${Math.max(0, set.timer)}s` : "";
      if (set.label) {
        setStr += ` (${set.label})`;
      }
      result.push(setStr);
    }
    return (isCurrent ? "! " : "") + result.map((r) => r.trim()).join(", ");
  }

  private getWarmupSets(sets: IPlannerProgramExerciseWarmupSet[]): string {
    const result: string[] = [];
    for (const set of sets) {
      let setStr = "";
      setStr += `${Math.max(0, set.numberOfSets)}x${Math.max(set.reps, 0)} `;
      if (set.weight != null) {
        setStr += `${Weight.print(set.weight)} `;
      } else if (set.percentage != null) {
        setStr += `${set.percentage}%`;
      }
      result.push(setStr);
    }
    return result.map((r) => r.trim()).join(", ");
  }
}
