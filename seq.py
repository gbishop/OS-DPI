# generate some data for a sequenced demo

words = """a
about
all
also
and
as
at
be
because
but
by
can
come
could
day
do
even
find
first
for
from
get
give
go
have
he
her
here
him
his
how
I
if
in
into
it
its
just
know
like
look
make
man
many
me
more
my
new
no
not
now
of
on
one
only
or
other
our
out
people
say
see
she
so
some
take
tell
than
that
the
their
them
then
there
these
they
thing
think
this
those
time
to
two
up
use
very
want
way
we
well
what
when
which
who
will
with
would
year
you
your""".split(
    "\n"
)

rows = 3
columns = 3
N = rows * columns
L = max(len(w) for w in words)

for i in range(L):
    # choose the words that have the current prefix
    for prefix in prefixes:
        currentWords = [words for word in words if word.startswith(prefix)]
