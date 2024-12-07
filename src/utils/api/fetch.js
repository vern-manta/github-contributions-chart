// import cheerio from "cheerio";
import _ from "lodash";
import axios from "axios";
import { TOKEN, COOKIE } from "../../../env";

const cheerio = require('cheerio');

const COLOR_MAP = {
  0: "#ebedf0",
  1: "#9be9a8",
  2: "#40c463",
  3: "#30a14e",
  4: "#216e39"
};

const LEVEL_MAP = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4
};

async function getGithubContributions({ username, from, to, token }) {
  if (!username || !token) {
    throw new Error("You must provide a github username and token");
  }

  const headers = {
    Authorization: `bearer ${token}`
  };
  const body = {
    query: `query {
        user(login: "${username}") {
          name
          contributionsCollection(from: "${from}", to: "${to}") {
            contributionCalendar {
              colors
              totalContributions
              weeks {
                contributionDays {
                  color
                  contributionCount
                  contributionLevel
                  date
                  weekday
                }
                firstDay
              }
            }
          }
        }
      }`
  };

  const response = await axios({
    url: "https://api.github.com/graphql",
    method: "post",
    data: { query: body.query },
    headers
  });
  return response;
}

async function fetchYears(username) {
  // const data = await fetch(`https://github.com/${username}?tab=contributions`, {
  //   headers: {
  //     "x-requested-with": "XMLHttpRequest"
  //   }
  // });
  // const body = await data.text();
  // const $ = cheerio.load(body);
  return [
    {
      href: `/${username}?action=show&controller=profiles&tab=contributions&user_id=${username}`,
      text: "2024"
    }
  ];
  // return $(".js-year-link.filter-item")
  //   .get()
  //   .map((a) => {
  //     const $a = $(a);
  //     const href = $a.attr("href");
  //     const githubUrl = new URL(`https://github.com${href}`);
  //     githubUrl.searchParams.set("tab", "contributions");
  //     const formattedHref = `${githubUrl.pathname}${githubUrl.search}`;

  //     return {
  //       href: formattedHref,
  //       text: $a.text().trim()
  //     };
  //   });
}

async function fetchDataForYear(url, year, format) {
  console.log("test", url, year);
  const data = await fetch(`https://github.com${url}`, {
    headers: {
      "x-requested-with": "XMLHttpRequest",
      "cookie": COOKIE,
    }
  });
  const $ = cheerio.load(await data.text());

  const $days = $(
    "table.ContributionCalendar-grid td.ContributionCalendar-day"
  );

  const contribText = $(".js-yearly-contributions h2")
    .text()
    .trim()
    .match(/^([0-9,]+)\s/);
  let contribCount;
  if (contribText) {
    [contribCount] = contribText;
    contribCount = parseInt(contribCount.replace(/,/g, ""), 10);
  }

  return {
    year,
    total: contribCount || 0,
    range: {
      start: $($days.get(0)).attr("data-date"),
      end: $($days.get($days.length - 1)).attr("data-date")
    },
    contributions: (() => {
      const parseDay = (day, index) => {
        const $day = $(day);
        const toolTipId = $day.attr("id")
        // console.log('test', toolTipId)

        const dayCountText = $(`tool-tip[for="${toolTipId}"]`).text().trim().match(/^([0-9,]+)\s/)
        
        let dayCount = 0;
        if (dayCountText) {
          [dayCount] = dayCountText;
          dayCount = parseInt(dayCount.replace(/,/g, ""), 10);
        }

        const date = $day
          .attr("data-date")
          .split("-")
          .map((d) => parseInt(d, 10));
        const color = COLOR_MAP[$day.attr("data-level")];
        const value = {
          date: $day.attr("data-date"),
          count: index === 0 ? contribCount : dayCount,
          color,
          intensity: $day.attr("data-level") || 0
        };

        // console.log('test', value.date, $day.attr("data-level"), dayCount)
        return { date, value };
      };

      if (format !== "nested") {
        return $days.get().map((day, index) => parseDay(day, index).value);
      }

      return $days.get().reduce((o, day, index) => {
        const { date, value } = parseDay(day, index);
        const [y, m, d] = date;
        if (!o[y]) o[y] = {};
        if (!o[y][m]) o[y][m] = {};
        o[y][m][d] = value;
        return o;
      }, {});
    })()
  };
}

// interface DataStructYear {
//   year: string;
//   total: number;
//   range: {
//     start: string;
//     end: string;
//   };
// }

// interface DataStructContribution {
//   date: string;
//   count: number;
//   color: string;
//   intensity: number;
// }

// interface DataStruct {
//   years: DataStructYear[];
//   contributions: DataStructContribution[];
// }

function getWeekDatesUpToToday() {
  const today = new Date();

  // 获取今天是本周的第几天（0 表示周日，1 表示周一，以此类推）
  const dayOfWeek = today.getDay();

  // 计算本周周日的日期
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - dayOfWeek);

  // 生成本周日期数组（从周日到今天）
  const thisWeekDates = [];
  const currentDate = new Date(startOfThisWeek);

  while (currentDate <= today) {
    thisWeekDates.push(currentDate.toISOString().split("T")[0]); // 格式为 YYYY-MM-DD
    currentDate.setDate(currentDate.getDate() + 1); // 加一天
  }

  return thisWeekDates;
}

function getLastWeekDates() {
  const today = new Date();

  // 获取今天是本周的第几天（0 表示周日，1 表示周一，以此类推）
  const dayOfWeek = today.getDay();

  // 计算上周周日的日期
  const startOfLastWeek = new Date(today);
  startOfLastWeek.setDate(today.getDate() - dayOfWeek - 7);

  // 生成上周日期数组（从周日开始）
  const lastWeekDates = [];
  const currentDate = new Date(startOfLastWeek);

  for (let i = 0; i < 7; i++) {
    lastWeekDates.push(currentDate.toISOString().split("T")[0]); // 格式为 YYYY-MM-DD
    currentDate.setDate(currentDate.getDate() + 1); // 加一天
  }

  return lastWeekDates;
}

export async function fetchDataForAllYears(username, format) {
  const years = await fetchYears(username);
  // [{
  //   href: '/raindust?tab=contributions&from=2024-12-01&to=2024-12-03',
  //   text: '2024'
  // }]
  return Promise.all(
    years
      .slice(0, 1)
      .map((year) =>
        fetchDataForYear(year.href, year.text, format)
      )
  ).then((resp) => {

    const thisWeekDates = getWeekDatesUpToToday()
    const lastWeekDates = getLastWeekDates()


    let thisWeekCount = 0
    let lastWeekCount = 0

    const result =  {
      login: username,
      years: (() => {
        const obj = {};
        const arr = resp.map((year) => {
          const { contributions, ...rest } = year;
          _.setWith(obj, [rest.year], rest, Object);
          return rest;
        });
        return format === "nested" ? obj : arr;
      })(),
      contributions:
        format === "nested"
          ? resp.reduce((acc, curr) => _.merge(acc, curr.contributions))
          : resp
            .reduce((list, curr) => [...list, ...curr.contributions], [])
            .sort((a, b) => {
              if (a.date < b.date) return 1;
              else if (a.date > b.date) return -1;
              return 0;
            }),
      thisWeekCount: thisWeekCount,
      lastWeekCount: lastWeekCount
    }

    thisWeekDates.forEach(day => {
      let contribute = result.contributions.find(r => r.date === day)
      thisWeekCount += contribute?.count
    })
    lastWeekDates.forEach(day => {
      let contribute = result.contributions.find(r => r.date === day)
      lastWeekCount += contribute?.count
    })

    result.thisWeekCount = thisWeekCount
    result.lastWeekCount = lastWeekCount

    return result;
  });
}

export async function fetchDataForHalfMonths(username) {
  const token = TOKEN;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const to = today.toISOString();
  today.setMonth(today.getMonth() - 6);
  const from = today.toISOString();

  const resp = await getGithubContributions({ username, token, to, from });
  if (!resp.data) return {};
  const data = resp.data.data;
  const contributionCalendar =
    data.user.contributionsCollection.contributionCalendar;
  const start = contributionCalendar.weeks[0].firstDay;
  const end = contributionCalendar.weeks
    .slice(-1)[0]
    .contributionDays.slice(-1)[0].date;
  const contributions = [];
  contributionCalendar.weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      contributions.push({
        date: day.date,
        count: day.contributionCount,
        color: day.color,
        intensity: LEVEL_MAP[day.contributionLevel]
      });
    });
  });

  const reverseWeeks = [...contributionCalendar.weeks].reverse();
  const thisWeekCount = reverseWeeks[0].contributionDays.reduce(
    (a, b) => b.contributionCount + a,
    0
  );
  const lastWeekCount = reverseWeeks[1].contributionDays.reduce(
    (a, b) => b.contributionCount + a,
    0
  );
  return {
    login: username,
    years: [
      {
        year: end.slice(0, 4),
        total: contributionCalendar.totalContributions,
        range: {
          start: start,
          end: end
        }
      }
    ],
    contributions: contributions,
    contributionCalendar: contributionCalendar, // 备用
    thisWeekCount: thisWeekCount,
    lastWeekCount: lastWeekCount
  };
}
