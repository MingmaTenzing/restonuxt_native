import { Text, type TextProps } from 'react-native';
import TimeAgo from 'react-timeago';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';
import enStrings from 'react-timeago/lib/language-strings/en';

const formatter = buildFormatter(enStrings);

type RelativeTimeProps = TextProps & {
  date: string | number | Date;
  live?: boolean;
};

export function RelativeTime({ date, live = true, ...textProps }: RelativeTimeProps) {
  return <TimeAgo component={Text} date={date} formatter={formatter} live={live} {...textProps} />;
}
