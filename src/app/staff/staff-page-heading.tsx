/**
 * The heading row every staff screen opens with (styles: `.counter-page-heading`
 * in staff.css). One component so the loaded page, its loading screen and its
 * error screen all put the title in the same place, at the same size.
 */
export function StaffPageHeading({ title }: { title: string }) {
  return (
    <div className="counter-page-heading">
      <h1 className="display">{title}</h1>
    </div>
  );
}
