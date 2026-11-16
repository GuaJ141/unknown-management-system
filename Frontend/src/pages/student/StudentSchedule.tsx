import { useEffect, useState } from 'react'
import {
  getScheduleSemesters,
  getStudentScheduleBySemester,
  type StudentScheduleEntry,
} from '../../api/student'
import './student-schedule.css'

interface StudentScheduleProps {
  token: string
  refreshKey: number
}

const weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']

export function StudentSchedule({ token, refreshKey }: StudentScheduleProps) {
  const [semesters, setSemesters] = useState<string[]>([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [schedule, setSchedule] = useState<StudentScheduleEntry[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [loadedQueryKey, setLoadedQueryKey] = useState('')
  const [queryError, setQueryError] = useState<{ key: string; message: string } | null>(null)
  const [queryKey, setQueryKey] = useState(0)
  const activeQueryKey = `${selectedSemester}:${refreshKey}:${queryKey}`
  const scheduleLoading =
    Boolean(selectedSemester) && loadedQueryKey !== activeQueryKey
  const errorMessage =
    optionsError ||
    (queryError?.key === activeQueryKey ? queryError.message : '')

  useEffect(() => {
    let active = true

    void getScheduleSemesters(token)
      .then((items) => {
        if (!active) return
        setSemesters(items)
        setSelectedSemester((current) =>
          current && items.includes(current) ? current : (items.at(-1) ?? ''),
        )
      })
      .catch((error: unknown) => {
        if (active) {
          setOptionsError(
            error instanceof Error ? error.message : '课表学期加载失败，请稍后重试',
          )
        }
      })
      .finally(() => {
        if (active) setOptionsLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    if (!selectedSemester) return

    let active = true

    void getStudentScheduleBySemester(token, selectedSemester)
      .then((entries) => {
        if (active) {
          setSchedule(entries)
          setQueryError(null)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setSchedule([])
          setQueryError({
            key: activeQueryKey,
            message:
              error instanceof Error ? error.message : '课表查询失败，请稍后重试',
          })
        }
      })
      .finally(() => {
        if (active) setLoadedQueryKey(activeQueryKey)
      })

    return () => {
      active = false
    }
  }, [activeQueryKey, token, selectedSemester])

  return (
    <div className="student-schedule">
      <section className="student-panel">
        <div className="student-panel-heading">
          <div>
            <h2>查询课表</h2>
            <p>选择学期查看本人所在班级的课程安排。</p>
          </div>
        </div>
        <form
          className="student-schedule-form"
          onSubmit={(event) => {
            event.preventDefault()
            setQueryKey((key) => key + 1)
          }}
        >
          <label className="student-schedule-term">
            <span>学期</span>
            <select
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
              disabled={optionsLoading || semesters.length === 0}
              required
            >
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </label>
          <button
            className="student-primary-button"
            type="submit"
            disabled={
              optionsLoading ||
              scheduleLoading ||
              !selectedSemester ||
              semesters.length === 0
            }
          >
            {optionsLoading
              ? '正在加载学期…'
              : scheduleLoading
                ? '查询中…'
                : '查询课表'}
          </button>
        </form>
      </section>

      <section className="student-panel">
        <div className="student-panel-heading">
          <div>
            <h2>每周课程安排</h2>
            <p>
              {selectedSemester
                ? `${selectedSemester} · 我的班级课表`
                : '选择学期后查看课程安排。'}
            </p>
          </div>
        </div>

        {optionsLoading && (
          <p className="student-schedule-message">正在加载课表查询条件…</p>
        )}
        {!optionsLoading && semesters.length === 0 && !errorMessage && (
          <p className="student-schedule-message">当前没有可查询的排课学期。</p>
        )}
        {errorMessage && (
          <p className="student-schedule-message is-error" role="alert">
            {errorMessage}
          </p>
        )}
        {scheduleLoading && (
          <p className="student-schedule-message">正在加载课表…</p>
        )}
        {!optionsLoading &&
          !scheduleLoading &&
          !errorMessage &&
          selectedSemester &&
          schedule.length === 0 && (
            <p className="student-schedule-message">该学期暂无课表安排。</p>
          )}

        {schedule.length > 0 && (
          <div className="student-schedule-scroll">
            <div className="student-schedule-grid">
              <div className="student-schedule-heading student-schedule-corner">
                节次
              </div>
              {weekdays.map((day, index) => (
                <div
                  className="student-schedule-heading"
                  key={day}
                  style={{ gridColumn: index + 2, gridRow: 1 }}
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 12 }, (_, index) => (
                <div
                  className="student-schedule-period"
                  key={`period-${index + 1}`}
                  style={{ gridColumn: 1, gridRow: index + 2 }}
                />
              ))}
              {Array.from({ length: 84 }, (_, index) => {
                const weekday = Math.floor(index / 12) + 1
                const section = (index % 12) + 1
                return (
                  <div
                    className="student-schedule-cell"
                    key={`cell-${weekday}-${section}`}
                    style={{
                      gridColumn: weekday + 1,
                      gridRow: section + 1,
                    }}
                  />
                )
              })}
              {schedule.map((entry) => (
                <article
                  className="student-schedule-course"
                  key={entry.scheduleId}
                  style={{
                    gridColumn: entry.weekday + 1,
                    gridRow: `${entry.startSection + 1} / span ${entry.endSection - entry.startSection + 1}`,
                  }}
                  title={`${entry.courseName} · 第${entry.startWeek}-${entry.endWeek}周`}
                >
                  <strong>{entry.courseName}</strong>
                  <span>
                    第{entry.startWeek}
                    {entry.endWeek !== entry.startWeek ? `-${entry.endWeek}` : ''}
                    周
                  </span>
                  {entry.teacherName && <span>{entry.teacherName}</span>}
                  {entry.location && <span>{entry.location}</span>}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
